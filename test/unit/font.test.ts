import { expect } from '@open-wc/testing';
import { ensureGoogleSansFlex, GOOGLE_SANS_FLEX_URL } from '../../src/font';

describe('ensureGoogleSansFlex', () => {
  it('adds exactly one document-level stylesheet and anonymous preconnect', () => {
    const doc = document.implementation.createHTMLDocument();
    ensureGoogleSansFlex(doc);
    ensureGoogleSansFlex(doc);

    const stylesheets = doc.head.querySelectorAll<HTMLLinkElement>('#mt-google-sans-flex');
    expect(stylesheets.length).to.equal(1);
    expect(stylesheets[0].tagName).to.equal('LINK');
    expect(stylesheets[0].rel).to.equal('stylesheet');
    expect(stylesheets[0].href).to.equal(GOOGLE_SANS_FLEX_URL);
    expect(GOOGLE_SANS_FLEX_URL).to.equal(
      'https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght,GRAD,ROND@6..144,1..1000,0..100,0..100&display=swap'
    );
    const preconnects = doc.head.querySelectorAll<HTMLLinkElement>('#mt-gstatic-preconnect');
    expect(preconnects.length).to.equal(1);
    expect(preconnects[0].rel).to.equal('preconnect');
    expect(preconnects[0].href).to.equal('https://fonts.gstatic.com/');
    expect(preconnects[0].crossOrigin).to.equal('anonymous');
  });

  it('respects existing IDs anywhere in the document', () => {
    const doc = document.implementation.createHTMLDocument();
    for (const id of ['mt-google-sans-flex', 'mt-gstatic-preconnect']) {
      const existing = doc.createElement('div');
      existing.id = id;
      doc.body.appendChild(existing);
    }
    ensureGoogleSansFlex(doc);
    expect(doc.head.querySelectorAll('link').length).to.equal(0);
  });
});
