/** Google Sans Flex stylesheet including the rounded axis and optical sizing range. */
export const GOOGLE_SANS_FLEX_URL =
  'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght,GRAD,ROND@6..144,1..1000,0..100,0..100&display=swap';

/**
 * Register Google Sans Flex at document level, shared by all card instances.
 * Font faces cannot be registered from the card's shadow root.
 * @param doc the document receiving the stylesheet and font preconnect
 */
export function ensureGoogleSansFlex(doc: Document = document): void {
  if (!doc.getElementById('mt-gstatic-preconnect')) {
    const preconnect = doc.createElement('link');
    preconnect.id = 'mt-gstatic-preconnect';
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.gstatic.com';
    preconnect.crossOrigin = 'anonymous';
    doc.head.appendChild(preconnect);
  }
  if (!doc.getElementById('mt-google-sans-flex')) {
    const stylesheet = doc.createElement('link');
    stylesheet.id = 'mt-google-sans-flex';
    stylesheet.rel = 'stylesheet';
    stylesheet.href = GOOGLE_SANS_FLEX_URL;
    doc.head.appendChild(stylesheet);
  }
}
