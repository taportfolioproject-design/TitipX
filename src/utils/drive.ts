/**
 * Utility to extract Google Drive file ID and convert it to a reliable direct preview URL.
 * Handles:
 * - Direct ID (e.g. "1A2B3C...")
 * - /file/d/{id}/view
 * - id={id} query param
 * - uc?id={id}
 * - Direct HTTP URLs (Unsplash, Cloudinary, etc.) fallback safely
 */
export function getGoogleDriveImageUrl(rawInput?: string, size = 1000): string {
  if (!rawInput || typeof rawInput !== 'string') {
    return 'https://placehold.co/600x600/f1f5f9/475569?text=No+Image';
  }

  const trimmed = rawInput.trim();

  // If it's already an external non-drive image URL, return as-is
  if (
    trimmed.startsWith('http') &&
    !trimmed.includes('drive.google.com') &&
    !trimmed.includes('docs.google.com')
  ) {
    return trimmed;
  }

  // Extract ID from Google Drive URL patterns
  let driveId = '';

  // Pattern 1: /file/d/{id}/...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    driveId = fileDMatch[1];
  }

  // Pattern 2: id={id}
  if (!driveId) {
    const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      driveId = idParamMatch[1];
    }
  }

  // Pattern 3: direct ID string (alphanumeric with hyphens/underscores, usually 25-45 chars)
  if (!driveId && /^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    driveId = trimmed;
  }

  if (driveId) {
    // Google Drive direct image thumbnail endpoint with high resolution
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w${size}`;
  }

  return trimmed || 'https://placehold.co/600x600/f1f5f9/475569?text=Image+Not+Found';
}
