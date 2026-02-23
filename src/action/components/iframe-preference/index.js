import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'iframe-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <iframe id="iframe"></iframe>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  './index.css',
].map(import.meta.resolve));

class IframePreferenceElement extends CustomElement {
  /** @type {HTMLIFrameElement} */ #iframeElement;

  constructor () {
    super(templateDocument, adoptedStyleSheets);
    this.#iframeElement = this.shadowRoot.getElementById('iframe');
  }

  /** @param {string} label Accessible description for this preference box. */
  set label (label = '') { this.#iframeElement.title = label; }
  get label () { return this.#iframeElement.title; }

  /** @param {string} src A page URL, relative to `src/`, to be embedded in the feature's preference list. */
  set src (src = '') { this.#iframeElement.src = src; }
  get src () { return this.#iframeElement.src; }

  connectedCallback () {
    this.role ||= 'listitem';
    this.slot ||= 'preferences';
  }
}

customElements.define(localName, IframePreferenceElement);

/**
 * @typedef IframePreferenceProps
 * @property {string} label The preference's label (e.g. `"Manage tag bundles"`).
 * @property {string} src The preference's URL, relative to `src/` (e.g. `"/features/quick_tags/options/index.html"`).
 */

/** @type {(props: IframePreferenceProps) => IframePreferenceElement} */
export const IframePreference = (props = {}) => Object.assign(document.createElement(localName), props);
