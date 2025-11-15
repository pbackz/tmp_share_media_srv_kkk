import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { Readable } from "stream";

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

// Initialize R2 client
let r2Client: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (r2Client) return r2Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn("R2 credentials not configured. Using local storage fallback.");
    return null;
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return r2Client;
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "temp-media-share";

// Convert Web ReadableStream to Buffer
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

// Clean expired files
export async function cleanExpiredFiles() {
  const client = getR2Client();
  if (!client) return;

  const now = Date.now();
  const expiredIds: string[] = [];

  for (const [id, data] of Object.entries(metadata)) {
    if (data.expiresAt < now) {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: data.filename,
          })
        );
        expiredIds.push(id);
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
  const client = getR2Client();

  if (!client) {
    throw new Error("R2 not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME environment variables.");
  }

  await cleanExpiredFiles();

  const id = nanoid(10);
  const ext = originalName.substring(originalName.lastIndexOf("."));
  const filename = `${id}${ext}`;

  // Convert stream to buffer for upload
  const buffer = await streamToBuffer(fileStream);

  // Upload to R2
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: mimeType,
      Metadata: {
        originalName,
        uploadedAt: Date.now().toString(),
      },
    })
  );

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
export async function getFileFromR2(id: string): Promise<{ data: ShareData; buffer: Buffer } | null> {
  await cleanExpiredFiles();

  const shareData = metadata[id];

  if (!shareData) {
    return null;
  }

  if (shareData.expiresAt < Date.now()) {
    return null;
  }

  const client = getR2Client();

  if (!client) {
    throw new Error("R2 not configured.");
  }

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: shareData.filename,
      })
    );

    if (!response.Body) {
      return null;
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as Readable;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return { data: shareData, buffer };
  } catch (error) {
    console.error(`Error reading file ${id}:`, error);
    return null;
  }
}

// Check if R2 is configured
export function isR2Configured(): boolean {
  return getR2Client() !== null;
}
