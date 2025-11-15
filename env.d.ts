/// <reference types="@cloudflare/workers-types" />

// Extend Cloudflare environment bindings for Next.js on Pages
// This must be in the global scope to augment the CloudflareEnv interface
interface CloudflareEnv {
  METADATA_KV?: KVNamespace;
}
