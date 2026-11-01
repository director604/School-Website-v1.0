/**
 * Extracts and cleans the Google Maps embed URL from either raw iframe code or a direct URL.
 * Handles:
 * - <iframe src="https://www.google.com/maps/embed?..." ...></iframe>
 * - https://www.google.com/maps/embed?...
 * - https://maps.google.com/...
 */
export const cleanMapEmbedUrl = (raw: string | undefined | null): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  
  // Check if string contains an iframe tag and extract src attribute
  const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (srcMatch && srcMatch[1]) {
    return srcMatch[1].trim();
  }
  
  // If it's already a clean URL or starts with http
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  return trimmed;
};
