import { NextRequest, NextResponse } from "next/server";
import { getFileFromR2, isR2Configured } from "@/lib/r2-storage";

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Cloudflare R2 storage not configured" },
        { status: 500 }
      );
    }

    const result = await getFileFromR2(id);

    if (!result) {
      return NextResponse.json(
        { error: "File not found or expired" },
        { status: 404 }
      );
    }

    return new Response(new Uint8Array(result.buffer), {
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
