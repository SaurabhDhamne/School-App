'use client';

/**
 * Converts a base64 or data:application/pdf URI into a browser-native Blob URL.
 * Chromium (Chrome, Edge, Brave) intentionally blocks inline iframe rendering of 'data:' URIs
 * for security reasons, resulting in a blank white box.
 * Converting to a same-origin 'blob:' URI enables the native Chromium PDF viewer.
 */
export function getPdfBlobUrl(dataUriOrUrl) {
  let target = dataUriOrUrl;
  if (!target || target === 'null' || target === 'undefined') {
    target = SAMPLE_WORKSHEET_PDF;
  }
  if (typeof window === 'undefined') return target;

  // Already a valid URL or blob URL
  if (
    target.startsWith('blob:') ||
    target.startsWith('http://') ||
    target.startsWith('https://')
  ) {
    return target;
  }

  try {
    const base64Index = target.indexOf('base64,');
    const base64String = base64Index !== -1 ? target.slice(base64Index + 7) : target;
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
    return target;
  }
}



export const SAMPLE_WORKSHEET_PDF = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgL0YyIDYgMCBSID4+ID4+ID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggMTE2NiA+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjUwIDc4MCBUZAooTXlTY2hvb2wgLSBDbGFzcyA4LUEgTWF0aGVtYXRpY3MpIFRqCi9GMiAxMSBUZgowIC0yMiBUZAooVG9waWM6IExpbmVhciBFcXVhdGlvbnMgaW4gT25lIFZhcmlhYmxlIC0gUHJhY3RpY2UgV29ya3NoZWV0KSBUagowIC0xOCBUZAooVGVhY2hlcjogTXJzLiBQcml5YSBTaGFybWEgfCBEdWUgRGF0ZTogMjAyNi0xMS0xNCkgVGoKMCAtMjYgVGQKL0YxIDEyIFRmCihJbnN0cnVjdGlvbnMgZm9yIFN0dWRlbnRzOikgVGoKL0YyIDEwIFRmCjAgLTE2IFRkCigxLiBTb2x2ZSBhbGwgOCBxdWVzdGlvbnMgaW4geW91ciBtYXRoZW1hdGljcyBob21ld29yayBub3RlYm9vay4pIFRqCjAgLTE0IFRkCigyLiBTaG93IGFsbCBzdGVwLWJ5LXN0ZXAgd29ya2luZyBhbmQgYWxnZWJyYWljIHRyYW5zcG9zaXRpb25zLikgVGoKMCAtMTQgVGQKKDMuIFZlcmlmeSB5b3VyIHNvbHV0aW9ucyBieSBzdWJzdGl0dXRpbmcgdGhlIHZhbHVlIG9mIHggYmFjayBpbnRvIHRoZSBlcXVhdGlvbi4pIFRqCjAgLTI2IFRkCi9GMSAxMiBUZgooRXhlcmNpc2UgNC4yOiBQcmFjdGljZSBRdWVzdGlvbnMpIFRqCi9GMiAxMCBUZgowIC0xOCBUZAooUTEuIFNvbHZlIGZvciB4OiAgMnggKyA3ID0gMTUpIFRqCjAgLTE4IFRkCihRMi4gU29sdmUgZm9yIHg6ICA1eCAtIDMgPSAzeCArIDkpIFRqCjAgLTE4IFRkCihRMy4gU29sdmUgZm9yIHg6ICAoeCAvIDMpICsgNCA9IDEwKSBUagowIC0xOCBUZAooUTQuIFNvbHZlIGZvciB4OiAgNCgyeCAtIDEpID0gMyh4ICsgMikpIFRqCjAgLTE4IFRkCihRNS4gU29sdmUgZm9yIHk6ICA3eSAtICgyeSArIDUpID0gMTUpIFRqCjAgLTE4IFRkCihRNi4gVGhlIHBlcmltZXRlciBvZiBhIHJlY3RhbmdsZSBpcyA0MCBjbS4gSWYgaXRzIGxlbmd0aCBpcyA0IGNtIG1vcmUgdGhhbiBicmVhZHRoLCBmaW5kIHguKSBUagowIC0xOCBUZAooUTcuIFNvbHZlOiAgKDJ4ICsgMSkgLyAoM3ggLSAyKSA9IDUgLyA5KSBUagowIC0xOCBUZAooUTguIFRocmVlIGNvbnNlY3V0aXZlIGludGVnZXJzIGFkZCB1cCB0byA1MS4gRm9ybSB0aGUgbGluZWFyIGVxdWF0aW9uIGFuZCBmaW5kIHRoZSBpbnRlZ2Vycy4pIFRqCjAgLTMwIFRkCi9GMSAxMCBUZgooKioqIEVuZCBvZiBXb3Jrc2hlZXQgLSBCZXN0IG9mIEx1Y2shICoqKikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkID4+CmVuZG9iago2IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCjAwMDAwMDE0NjkgMDAwMDAgbiAKMDAwMDAwMTU0NCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDcgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjE2MTQKJSVFT0Y=";
