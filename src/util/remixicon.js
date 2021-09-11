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

export const buildSvg = function (symbolId) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${symbolId}`);
  svg.appendChild(use);

  return svg;
};
