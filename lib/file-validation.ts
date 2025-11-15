// File validation utilities for security

// Allowed MIME types (most common and safe formats)
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',

  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov

  // Documents
  'application/pdf',
  'text/plain',

  // Audio
  'audio/mpeg', // .mp3
  'audio/wav',
  'audio/webm',
]);

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',

  // Videos
  '.mp4', '.webm', '.mov',

  // Documents
  '.pdf', '.txt',

  // Audio
  '.mp3', '.wav',
]);

// Dangerous extensions to explicitly block
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif',
  '.vbs', '.js', '.jar', '.app', '.deb', '.rpm',
  '.sh', '.bash', '.ps1', '.msi', '.dmg',
]);

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File, maxSize: number = 1024 * 1024 * 1024): ValidationResult {
  // 1. Check file size
  if (file.size === 0) {
    return { valid: false, error: 'Le fichier est vide' };
  }

  if (file.size > maxSize) {
    const maxSizeGB = maxSize / (1024 * 1024 * 1024);
    return {
      valid: false,
      error: `Le fichier dépasse la limite de ${maxSizeGB}GB`
    };
  }

  // 2. Check file extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));

  // Block dangerous extensions
  if (BLOCKED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: 'Type de fichier non autorisé pour des raisons de sécurité'
    };
  }

  // Allow only specific extensions
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      error: `Extension de fichier non autorisée. Formats acceptés : ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
    };
  }

  // 3. Check MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Type MIME non autorisé. Types acceptés : images, vidéos (MP4, WebM, MOV), PDF, texte et audio (MP3, WAV)`
    };
  }

  // 4. Validate filename (prevent path traversal)
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Nom de fichier invalide'
    };
  }

  // 5. Check filename length
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'Nom de fichier trop long (max 255 caractères)'
    };
  }

  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  // Remove any path components
  let sanitized = filename.replace(/^.*[\/\\]/, '');

  // Remove any non-alphanumeric characters except dot, dash, underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
    sanitized = nameWithoutExt.substring(0, 255 - extension.length) + extension;
  }

  return sanitized;
}

export function getAcceptedFileTypes(): string {
  return Array.from(ALLOWED_EXTENSIONS).join(',');
}
