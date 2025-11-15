import { NextRequest, NextResponse } from "next/server";

// Proxy to Cloudflare Worker
const WORKER_URL = process.env.WORKER_URL || "https://flash-share-upload-worker.pierre-baconnier.workers.dev";

// Required by @cloudflare/next-on-pages
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData();

    // Forward to Worker
    const workerResponse = await fetch(`${WORKER_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    // Return Worker's response
    const data = await workerResponse.json();

    if (!workerResponse.ok) {
      return NextResponse.json(data, { status: workerResponse.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
