import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from '@cloudflare/next-on-pages';
import { saveFileToR2, isR2Configured } from "@/lib/r2-storage-kv";
import { validateFile, sanitizeFilename } from "@/lib/file-validation";

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes timeout for large uploads

export async function POST(request: NextRequest) {
  try {
    // Get Cloudflare KV namespace if available
    let kv: any = undefined;
    try {
      const ctx = getRequestContext();
      kv = ctx.env.METADATA_KV;
    } catch (e) {
      console.log("KV not available, using in-memory fallback");
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const expiresIn = formData.get("expiresIn") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Stockage R2 non configuré. Vérifiez les variables d'environnement dans Cloudflare Pages." },
        { status: 500 }
      );
    }

    // Validate file (security checks)
    const maxSize = 1024 * 1024 * 1024; // 1GB
    const validation = validateFile(file, maxSize);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Validate expiration time
    const expiresInHours = parseInt(expiresIn) || 1;
    if (expiresInHours < 1 || expiresInHours > 168) { // Max 1 week
      return NextResponse.json(
        { error: "Durée d'expiration invalide (1h - 168h)" },
        { status: 400 }
      );
    }

    // Sanitize filename to prevent security issues
    const sanitizedFilename = sanitizeFilename(file.name);

    // Use Cloudflare R2 storage
    console.log("Using Cloudflare R2 storage with", kv ? "KV" : "in-memory fallback");
    const shareData = await saveFileToR2(
      file.stream(),
      sanitizedFilename,
      file.type,
      file.size,
      expiresInHours,
      kv
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
