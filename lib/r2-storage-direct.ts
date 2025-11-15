/// <reference types="@cloudflare/workers-types" />

export interface ShareData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt: number;
  createdAt: number;
}

// Generate a secure random ID using Web Crypto API
function generateId(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map(v => chars[v % chars.length])
    .join('');
}

// In-memory metadata store fallback
const metadata: Record<string, ShareData> = {};

// Save metadata to KV or in-memory fallback
async function saveMetadata(id: string, data: ShareData, kv?: KVNamespace) {
  if (kv) {
    const ttlSeconds = Math.floor((data.expiresAt - Date.now()) / 1000);
    await kv.put(`metadata:${id}`, JSON.stringify(data), {
      expirationTtl: ttlSeconds > 0 ? ttlSeconds : 3600,
    });
  } else {
    metadata[id] = data;
  }
}

// Get metadata from KV or in-memory fallback
async function getMetadata(id: string, kv?: KVNamespace): Promise<ShareData | null> {
  if (kv) {
    const data = await kv.get(`metadata:${id}`);
    return data ? JSON.parse(data) : null;
  } else {
    return metadata[id] || null;
  }
}

// Delete metadata from KV or in-memory fallback
async function deleteMetadata(id: string, kv?: KVNamespace) {
  if (kv) {
    await kv.delete(`metadata:${id}`);
  } else {
    delete metadata[id];
  }
}

// Save uploaded file to R2 using native R2 binding (no S3 API)
export async function saveFileToR2(
  fileStream: ReadableStream,
  originalName: string,
  mimeType: string,
  size: number,
  expiresInHours: number,
  r2Bucket?: R2Bucket,
  kv?: KVNamespace
): Promise<ShareData> {
  console.log("[R2] saveFileToR2 called for:", originalName, "Size:", size);

  if (!r2Bucket) {
    console.error("[R2] R2 bucket binding not available!");
    throw new Error("R2 bucket not configured. Please add R2 bucket binding in Cloudflare Pages.");
  }

  const id = generateId(10);
  const ext = originalName.substring(originalName.lastIndexOf("."));
  const filename = `${id}${ext}`;

  console.log("[R2] Generated ID:", id, "Filename:", filename);

  // Upload directly to R2 using the binding
  console.log("[R2] Uploading to R2 using native binding...");

  await r2Bucket.put(filename, fileStream, {
    httpMetadata: {
      contentType: mimeType,
      contentDisposition: `attachment; filename="${originalName}"`,
      cacheControl: 'no-cache, no-store, must-revalidate',
    },
    customMetadata: {
      originalname: originalName,
      uploadedat: Date.now().toString(),
    },
  });

  console.log("[R2] File uploaded successfully to R2!");

  const shareData: ShareData = {
    id,
    filename,
    originalName,
    mimeType,
    size,
    expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
    createdAt: Date.now(),
  };

  await saveMetadata(id, shareData, kv);

  return shareData;
}

// Get file from R2 using native binding
export async function getFileFromR2(
  id: string,
  r2Bucket?: R2Bucket,
  kv?: KVNamespace
): Promise<{ data: ShareData; buffer: ArrayBuffer } | null> {
  console.log("[R2] getFileFromR2 called for ID:", id);

  const shareData = await getMetadata(id, kv);

  if (!shareData) {
    console.log("[R2] No metadata found for ID:", id);
    return null;
  }

  if (shareData.expiresAt < Date.now()) {
    console.log("[R2] File expired for ID:", id);
    await deleteMetadata(id, kv);
    return null;
  }

  if (!r2Bucket) {
    console.error("[R2] R2 bucket binding not available!");
    throw new Error("R2 bucket not configured.");
  }

  try {
    console.log("[R2] Fetching file from R2:", shareData.filename);
    const object = await r2Bucket.get(shareData.filename);

    if (!object) {
      console.error("[R2] File not found in R2:", shareData.filename);
      return null;
    }

    const buffer = await object.arrayBuffer();
    console.log("[R2] File retrieved successfully, size:", buffer.byteLength);

    return { data: shareData, buffer };
  } catch (error) {
    console.error(`[R2] Error reading file ${id}:`, error);
    return null;
  }
}

// Check if R2 is configured
export function isR2Configured(r2Bucket?: R2Bucket): boolean {
  return !!r2Bucket;
}
