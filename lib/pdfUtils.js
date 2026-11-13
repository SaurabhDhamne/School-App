'use client';

/**
 * Converts a base64 or data:application/pdf URI into a browser-native Blob URL.
 * Chromium (Chrome, Edge, Brave) intentionally blocks inline iframe rendering of 'data:' URIs
 * for security reasons, resulting in a blank white box.
 * Converting to a same-origin 'blob:' URI enables the native Chromium PDF viewer.
 */
export function getPdfBlobUrl(dataUriOrUrl) {
  if (!dataUriOrUrl) return '';
  if (typeof window === 'undefined') return dataUriOrUrl;

  // Already a valid URL or blob URL
  if (
    dataUriOrUrl.startsWith('blob:') ||
    dataUriOrUrl.startsWith('http://') ||
    dataUriOrUrl.startsWith('https://')
  ) {
    return dataUriOrUrl;
  }

  try {
    const base64Index = dataUriOrUrl.indexOf('base64,');
    const base64String = base64Index !== -1 ? dataUriOrUrl.slice(base64Index + 7) : dataUriOrUrl;
    const clean = base64String.replace(/[\r\n\s]/g, '');
    const byteCharacters = atob(clean);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error('getPdfBlobUrl conversion error:', e);
    return dataUriOrUrl;
  }
}

