/**
 * Cloudflare Worker pour gérer les uploads R2
 * Déployer avec: wrangler deploy workers/upload-worker.js
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: POST /upload
      if (url.pathname === '/upload' && request.method === 'POST') {
        return await handleUpload(request, env, corsHeaders);
      }

      // Route: GET /file/:id
      if (url.pathname.startsWith('/file/') && request.method === 'GET') {
        const id = url.pathname.split('/')[2];
        return await handleDownload(id, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// Generate secure random ID
function generateId(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map(v => chars[v % chars.length])
    .join('');
}

async function handleUpload(request, env, corsHeaders) {
  const formData = await request.formData();
  const file = formData.get('file');
  const expiresIn = parseInt(formData.get('expiresIn')) || 1;

  if (!file) {
    return new Response(JSON.stringify({ error: 'No file provided' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!env.R2_BUCKET) {
    return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate expiration
  if (expiresIn < 1 || expiresIn > 168) {
    return new Response(JSON.stringify({ error: 'Invalid expiration (1-168 hours)' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate unique ID and filename
  const id = generateId(10);
  const ext = file.name.substring(file.name.lastIndexOf('.'));
  const filename = `${id}${ext}`;

  // Upload to R2
  await env.R2_BUCKET.put(filename, file.stream(), {
    httpMetadata: {
      contentType: file.type,
      contentDisposition: `attachment; filename="${file.name}"`,
      cacheControl: 'no-cache, no-store, must-revalidate',
    },
    customMetadata: {
      originalname: file.name,
      uploadedat: Date.now().toString(),
      size: file.size.toString(),
    },
  });

  // Save metadata to KV
  const expiresAt = Date.now() + expiresIn * 60 * 60 * 1000;
  const metadata = {
    id,
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    expiresAt,
    createdAt: Date.now(),
  };

  if (env.METADATA_KV) {
    const ttlSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    await env.METADATA_KV.put(`metadata:${id}`, JSON.stringify(metadata), {
      expirationTtl: ttlSeconds > 0 ? ttlSeconds : 3600,
    });
  }

  return new Response(JSON.stringify({
    id,
    expiresAt,
    storage: 'cloudflare-r2',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleDownload(id, env, corsHeaders) {
  if (!env.R2_BUCKET) {
    return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get metadata from KV
  let metadata = null;
  if (env.METADATA_KV) {
    const data = await env.METADATA_KV.get(`metadata:${id}`);
    if (data) {
      metadata = JSON.parse(data);

      // Check if expired
      if (metadata.expiresAt < Date.now()) {
        await env.METADATA_KV.delete(`metadata:${id}`);
        return new Response(JSON.stringify({ error: 'File expired' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
  }

  if (!metadata) {
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get file from R2
  const object = await env.R2_BUCKET.get(metadata.filename);

  if (!object) {
    return new Response(JSON.stringify({ error: 'File not found in storage' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(object.body, {
    headers: {
      ...corsHeaders,
      'Content-Type': metadata.mimeType,
      'Content-Disposition': `inline; filename="${metadata.originalName}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
