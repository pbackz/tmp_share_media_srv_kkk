import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { getFileFromR2, isR2Configured } from "@/lib/r2-storage-kv";

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes timeout for large file downloads

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get Cloudflare KV namespace if available
    let kv: any = undefined;
    try {
      const ctx = getRequestContext();
      kv = ctx.env.METADATA_KV;
    } catch (e) {
      console.log("KV not available, using in-memory fallback");
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Cloudflare R2 storage not configured" },
        { status: 500 }
      );
    }

    const result = await getFileFromR2(id, kv);

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
