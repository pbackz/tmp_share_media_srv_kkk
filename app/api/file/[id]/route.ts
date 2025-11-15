import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getFileFromR2, isR2Configured } from "@/lib/r2-storage-direct";

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes timeout for large file downloads

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get Cloudflare bindings
    let kv: any = undefined;
    let r2Bucket: any = undefined;

    try {
      const ctx = getRequestContext();
      kv = ctx.env.METADATA_KV;
      r2Bucket = ctx.env.R2_BUCKET;
    } catch (e) {
      console.log("[DOWNLOAD] Bindings not available");
    }

    if (!isR2Configured(r2Bucket)) {
      return NextResponse.json(
        { error: "Cloudflare R2 storage not configured" },
        { status: 500 }
      );
    }

    const result = await getFileFromR2(id, r2Bucket, kv);

    if (!result) {
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }

    return new Response(result.buffer, {
      headers: {
        "Content-Type": result.data.mimeType,
        "Content-Disposition": `inline; filename="${result.data.originalName}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("File retrieval error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve file" },
      { status: 500 }
    );
  }
}
