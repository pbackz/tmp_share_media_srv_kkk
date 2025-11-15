import { nanoid } from "nanoid";

export interface ShareData {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  expiresAt: number;
  createdAt: number;
}

// In-memory metadata store (for demo - in production use a database)
// For production, consider Cloudflare D1 (SQLite) or Durable Objects
const metadata: Record<string, ShareData> = {};

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "temp-media-share";

// Get R2 configuration
function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}

// Convert Web ReadableStream to ArrayBuffer
async function streamToArrayBuffer(stream: ReadableStream): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

// Helper to create AWS Signature V4
async function signRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: ArrayBuffer | null,
  config: ReturnType<typeof getR2Config>
) {
  if (!config) throw new Error("R2 not configured");

  const encoder = new TextEncoder();
  const algorithm = 'AWS4-HMAC-SHA256';
  const date = new Date();
  const dateStamp = date.toISOString().split('T')[0].replace(/-/g, '');
  const amzDate = date.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, -1) + 'Z';

  headers['x-amz-date'] = amzDate;
  headers['host'] = new URL(url).host;

  // Create canonical request
  const canonicalUri = new URL(url).pathname;
  const canonicalQuerystring = '';
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key].trim()}\n`)
    .join('');
  const signedHeaders = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');

  const payloadHash = body
    ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', body)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  // Create string to sign
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalRequestHash = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

  // Calculate signature
  async function hmac(key: BufferSource, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }

  let kDate = await hmac(encoder.encode(`AWS4${config.secretAccessKey}`), dateStamp);
  let kRegion = await hmac(kDate, 'auto');
  let kService = await hmac(kRegion, 's3');
  let kSigning = await hmac(kService, 'aws4_request');
  let signature = Array.from(new Uint8Array(await hmac(kSigning, stringToSign)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  headers['authorization'] = `${algorithm} Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return headers;
}

// Clean expired files
export async function cleanExpiredFiles() {
  const config = getR2Config();
  if (!config) return;

  const now = Date.now();
  const expiredIds: string[] = [];

  for (const [id, data] of Object.entries(metadata)) {
    if (data.expiresAt < now) {
      try {
        const url = `${config.endpoint}/${BUCKET_NAME}/${data.filename}`;
        const headers = await signRequest('DELETE', url, {}, null, config);

        const response = await fetch(url, {
          method: 'DELETE',
          headers,
        });

        if (response.ok) {
          expiredIds.push(id);
        }
      } catch (error) {
        console.error(`Error deleting file ${id}:`, error);
      }
    }
  }

  expiredIds.forEach((id) => delete metadata[id]);
}

// Save uploaded file to R2
export async function saveFileToR2(
  fileStream: ReadableStream,
  originalName: string,
  mimeType: string,
  size: number,
  expiresInHours: number
): Promise<ShareData> {
  const config = getR2Config();

  if (!config) {
    throw new Error("R2 not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.");
  }

  await cleanExpiredFiles();

  const id = nanoid(10);
  const ext = originalName.substring(originalName.lastIndexOf("."));
  const filename = `${id}${ext}`;

  // Convert stream to ArrayBuffer for upload
  const body = await streamToArrayBuffer(fileStream);

  // Upload to R2 with security headers using fetch
  const url = `${config.endpoint}/${BUCKET_NAME}/${filename}`;
  const headers = {
    'content-type': mimeType,
    'content-disposition': `attachment; filename="${originalName}"`,
    'cache-control': 'no-cache, no-store, must-revalidate',
    'x-amz-meta-originalname': originalName,
    'x-amz-meta-uploadedat': Date.now().toString(),
  };

  const signedHeaders = await signRequest('PUT', url, headers, body, config);

  const response = await fetch(url, {
    method: 'PUT',
    headers: signedHeaders,
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload to R2: ${response.status} ${response.statusText}`);
  }

  const shareData: ShareData = {
    id,
    filename,
    originalName,
    mimeType,
    size,
    expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
    createdAt: Date.now(),
  };

  metadata[id] = shareData;

  return shareData;
}

// Get file from R2
export async function getFileFromR2(id: string): Promise<{ data: ShareData; buffer: ArrayBuffer } | null> {
  await cleanExpiredFiles();

  const shareData = metadata[id];

  if (!shareData) {
    return null;
  }

  if (shareData.expiresAt < Date.now()) {
    return null;
  }

  const config = getR2Config();

  if (!config) {
    throw new Error("R2 not configured.");
  }

  try {
    const url = `${config.endpoint}/${BUCKET_NAME}/${shareData.filename}`;
    const headers = await signRequest('GET', url, {}, null, config);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to get file from R2: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();

    return { data: shareData, buffer };
  } catch (error) {
    console.error(`Error reading file ${id}:`, error);
    return null;
  }
}

// Check if R2 is configured
export function isR2Configured(): boolean {
  return getR2Config() !== null;
}
