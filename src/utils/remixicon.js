import { dom } from './dom.js';

const symbolsUrl = browser.runtime.getURL('/lib/remixicon/remixicon.symbol.svg');

if (document.querySelector(`svg[data-src="${symbolsUrl}"]`) === null) {
  fetch(symbolsUrl)
    .then(response => response.text())
    .then(responseText => {
      const responseDocument = (new DOMParser()).parseFromString(responseText, 'image/svg+xml');
      const symbols = responseDocument.firstElementChild;
      symbols.dataset.src = symbolsUrl;
      document.head.appendChild(symbols);
    });
}

/**
 * @see https://remixicon.com/
 * @param {string} symbolId RemixIcon symbol id to use
 * @returns {SVGElement} an SVG element that renders the specified icon
 */
export const buildSvg = symbolId => dom('svg', { xmlns: 'http://www.w3.org/2000/svg' }, null, [
  dom('use', { xmlns: 'http://www.w3.org/2000/svg', href: `#${symbolId}` }),
]);
