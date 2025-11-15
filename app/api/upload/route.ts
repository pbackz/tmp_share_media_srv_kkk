import { NextRequest, NextResponse } from "next/server";
import { saveFileToR2, isR2Configured } from "@/lib/r2-storage";

export const runtime = 'edge';

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

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Cloudflare R2 storage not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables." },
        { status: 500 }
      );
    }

    // 1GB file size limit with Cloudflare R2
    const maxSize = 1024 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 1GB limit.` },
        { status: 400 }
      );
    }

    const expiresInHours = parseInt(expiresIn) || 1;

    // Use Cloudflare R2 storage
    console.log("Using Cloudflare R2 storage");
    const shareData = await saveFileToR2(
      file.stream(),
      file.name,
      file.type,
      file.size,
      expiresInHours
    );

    return NextResponse.json({
      id: shareData.id,
      expiresAt: shareData.expiresAt,
      storage: "cloudflare-r2",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
