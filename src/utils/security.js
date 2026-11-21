/**
 * Client-side security utilities:
 * - Strict URL protocol validation (prevents javascript: / data: / vbscript: XSS)
 * - Safe text sanitization & length bounding
 * - File upload type & size validation
 * - Safe localStorage JSON read/write (explicitly excluding sensitive API keys)
 */

const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Validates and normalizes an external URL. Returns empty string if unsafe/invalid.
 * Blocks javascript:, data:, vbscript:, file:, etc.
 */
export function sanitizeExternalUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (!ALLOWED_URL_PROTOCOLS.has(parsed.protocol)) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Strips ASCII control characters and bounds string length for safe UI/API handling.
 */
export function sanitizeUserText(value, maxLength = 4000) {
  if (typeof value !== 'string') return '';
  // Remove NUL and non-printable control chars except tab/newline
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Validates an uploaded File object against size limit and allowed MIME/extension rules.
 */
export function validateUploadedFile(
  file,
  { maxBytes = 5 * 1024 * 1024, allowImages = true, allowPdf = true, allowText = true } = {}
) {
  if (!file || typeof file.size !== 'number') {
    return { valid: false, error: 'Invalid file object.' };
  }
  if (file.size === 0) {
    return { valid: false, error: 'The selected file is empty.' };
  }
  if (file.size > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File exceeds the ${maxMb} MB safety limit.` };
  }

  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();

  const isImage = mime.startsWith('image/') && !mime.includes('svg');
  const isPdf = mime === 'application/pdf' || name.endsWith('.pdf');
  const isText =
    mime.startsWith('text/') ||
    /\.(txt|md|csv|json|js|jsx|ts|tsx|py|html|css)$/i.test(name);

  if (isImage && allowImages) return { valid: true, kind: 'image' };
  if (isPdf && allowPdf) return { valid: true, kind: 'pdf' };
  if (isText && allowText) return { valid: true, kind: 'text' };

  return {
    valid: false,
    error: 'Unsupported file type. Please upload PNG/JPG/WebP images, PDF, or text/code notes.',
  };
}

/**
 * Validates that a data URL is strictly an allowed raster image or PDF (never SVG/HTML).
 */
export function isSafeMediaDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return false;
  return /^data:(image\/(png|jpeg|jpg|webp|gif)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(
    dataUrl
  );
}

/**
 * Strips any API secrets before persisting workspace preferences to localStorage.
 */
export function stripSecretsForStorage(state) {
  const { apiKey, apiKeys, ...safeState } = state || {};
  void apiKey;
  void apiKeys;
  return safeState;
}
