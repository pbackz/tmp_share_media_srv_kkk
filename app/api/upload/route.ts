import { NextRequest, NextResponse } from "next/server";
import { saveFileStream } from "@/lib/storage-stream";
import { saveFileToR2, isR2Configured } from "@/lib/r2-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const expiresIn = formData.get("expiresIn") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const useR2 = isR2Configured();

    // Dynamic file size limit based on storage backend
    const maxSize = useR2
      ? 1024 * 1024 * 1024 // 1GB with Cloudflare R2
      : 100 * 1024 * 1024;  // 100MB with local storage

    if (file.size > maxSize) {
      const limitText = useR2 ? "1GB" : "100MB";
      const upgradeText = useR2
        ? ""
        : " Configure Cloudflare R2 for files up to 1GB.";

      return NextResponse.json(
        { error: `File size exceeds ${limitText} limit.${upgradeText}` },
        { status: 400 }
      );
    }

    const expiresInHours = parseInt(expiresIn) || 1;

    let shareData;

    if (useR2) {
      // Use Cloudflare R2 (supports large files)
      console.log("Using Cloudflare R2 storage");
      shareData = await saveFileToR2(
        file.stream(),
        file.name,
        file.type,
        file.size,
        expiresInHours
      );
    } else {
      // Fallback to local streaming storage
      console.log("Using local streaming storage (R2 not configured)");
      shareData = await saveFileStream(
        file.stream(),
        file.name,
        file.type,
        file.size,
        expiresInHours
      );
    }

    return NextResponse.json({
      id: shareData.id,
      expiresAt: shareData.expiresAt,
      storage: useR2 ? "cloudflare-r2" : "local",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
