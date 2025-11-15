import fs from "fs/promises";
import path from "path";
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

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const METADATA_FILE = path.join(DATA_DIR, "metadata.json");

// Initialize storage directories
async function initStorage() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });

    try {
      await fs.access(METADATA_FILE);
    } catch {
      await fs.writeFile(METADATA_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
}

// Read metadata
async function readMetadata(): Promise<Record<string, ShareData>> {
  try {
    await initStorage();
    const data = await fs.readFile(METADATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Write metadata
async function writeMetadata(metadata: Record<string, ShareData>) {
  await initStorage();
  await fs.writeFile(METADATA_FILE, JSON.stringify(metadata, null, 2));
}

// Clean expired files
export async function cleanExpiredFiles() {
  const metadata = await readMetadata();
  const now = Date.now();
  let hasChanges = false;

  for (const [id, data] of Object.entries(metadata)) {
    if (data.expiresAt < now) {
      try {
        const filePath = path.join(UPLOADS_DIR, data.filename);
        await fs.unlink(filePath);
        delete metadata[id];
        hasChanges = true;
      } catch (error) {
        console.error(`Error deleting file ${id}:`, error);
      }
    }
  }

  if (hasChanges) {
    await writeMetadata(metadata);
  }
}

// Save uploaded file
export async function saveFile(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  expiresInHours: number
): Promise<ShareData> {
  await initStorage();
  await cleanExpiredFiles();

  const id = nanoid(10);
  const ext = path.extname(originalName);
  const filename = `${id}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.writeFile(filePath, fileBuffer);

  const shareData: ShareData = {
    id,
    filename,
    originalName,
    mimeType,
    size: fileBuffer.length,
    expiresAt: Date.now() + expiresInHours * 60 * 60 * 1000,
    createdAt: Date.now(),
  };

  const metadata = await readMetadata();
  metadata[id] = shareData;
  await writeMetadata(metadata);

  return shareData;
}

// Get file by ID
export async function getFile(id: string): Promise<{ data: ShareData; buffer: Buffer } | null> {
  await cleanExpiredFiles();

  const metadata = await readMetadata();
  const shareData = metadata[id];

  if (!shareData) {
    return null;
  }

  if (shareData.expiresAt < Date.now()) {
    return null;
  }

  try {
    const filePath = path.join(UPLOADS_DIR, shareData.filename);
    const buffer = await fs.readFile(filePath);
    return { data: shareData, buffer };
  } catch (error) {
    console.error(`Error reading file ${id}:`, error);
    return null;
  }
}
