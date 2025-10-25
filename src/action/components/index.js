export class CustomElement extends HTMLElement {
  /**
   * @param {Document} templateDocument Document object containing this element's template
   * @param {CSSStyleSheet[]} adoptedStyleSheets Stylesheet objects to adopt in this element's shadow root
   */
  constructor (templateDocument, adoptedStyleSheets) {
    super();

    const { content } = templateDocument.getElementById(this.localName);
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.replaceChildren(content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
  }
}

const cachedStyleSheets = new Map();

const fetchStyleSheet = (url) => fetch(url)
  .then(response => response.text())
  .then(text => new CSSStyleSheet().replace(text));

/**
 * @param {string[]} urls Absolute URLs pointing to stylesheets to request
 * @returns {Promise<CSSStyleSheet[]>} Array of CSSStyleSheet copies of requested stylesheets
 */
export function fetchStyleSheets (urls) {
  urls
    .filter(url => !cachedStyleSheets.has(url))
    .forEach(url => cachedStyleSheets.set(url, fetchStyleSheet(url)));
  return Promise.all(urls.map(url => cachedStyleSheets.get(url)));
}
