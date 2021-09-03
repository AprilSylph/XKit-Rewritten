fetch(browser.runtime.getURL('/lib/remixicon/remixicon.symbol.svg'))
  .then(response => response.text())
  .then(responseText => {
    const responseDocument = (new DOMParser()).parseFromString(responseText, 'image/svg+xml');
    const symbols = responseDocument.firstElementChild;
    document.head.appendChild(symbols);
  });

export const buildSvg = function (symbolId) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `#${symbolId}`);
  svg.appendChild(use);

  return svg;
};
