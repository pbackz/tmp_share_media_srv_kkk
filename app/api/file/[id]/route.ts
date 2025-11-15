import { NextRequest } from "next/server";

// Proxy to Cloudflare Worker
const WORKER_URL = process.env.WORKER_URL || "https://flash-share-upload-worker.pierre-baconnier.workers.dev";

// Required by @cloudflare/next-on-pages
export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Forward to Worker
    const workerResponse = await fetch(`${WORKER_URL}/file/${id}`);

    if (!workerResponse.ok) {
      const error = await workerResponse.json();
      return new Response(JSON.stringify(error), {
        status: workerResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return Worker's response (file stream)
    return new Response(workerResponse.body, {
      headers: {
        "Content-Type": workerResponse.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": workerResponse.headers.get("Content-Disposition") || "inline",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return new Response(JSON.stringify({ error: "Failed to retrieve file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
