import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'sponsor-progress';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <p id="caption">Loading…</p>
    <div id="progress" aria-hidden="true">
      <div id="progress-bar"></div>
    </div>
    <a id="cover-link" target="_blank" aria-label="Sponsor the project"></a>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  './index.css',
].map(import.meta.resolve));

class SponsorProgressElement extends CustomElement {
  /** @type {HTMLParagraphElement}  */ #captionElement;
  /** @type {HTMLDivElement}        */ #progressBarElement;
  /** @type {HTMLAnchorElement}     */ #coverLinkElement;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#captionElement = this.shadowRoot.getElementById('caption');
    this.#progressBarElement = this.shadowRoot.getElementById('progress-bar');
    this.#coverLinkElement = this.shadowRoot.getElementById('cover-link');
  }

  /**
   * @param {string} url A string or any other object with a stringifier that represents an absolute or relative URL.
   * @param {string} [base] A string representing the base URL to use in cases where `url` is a relative URL.
   * @returns {boolean} `true` if the URL can be parsed and is valid; `false` otherwise.
   */
  static canParseUrl (url, base) {
    try { return !!new URL(url, base); } catch { return false; }
  }

  async connectedCallback () {
    try {
      const response = await fetch('https://vercel.aprilsylph.dev/api/sponsors');
      const data = await response.json();

      if (typeof data?.sponsorsListing?.activeGoal?.percentComplete !== 'number') {
        throw new Error('Invalid sponsorship goal data');
      }
      if (typeof data?.sponsorsListing?.url !== 'string') {
        throw new Error('Invalid sponsorship URL');
      }

      const { percentComplete } = data.sponsorsListing.activeGoal;
      this.#captionElement.textContent = `${percentComplete}% funded`;
      this.#progressBarElement.style.width = `${percentComplete}%`;

      const { url } = data.sponsorsListing;
      if (SponsorProgressElement.canParseUrl(url)) {
        this.#coverLinkElement.href = url;
      }
    } catch {
      this.style.display = 'none';
    }
  }
}

customElements.define(localName, SponsorProgressElement);

export const SponsorProgress = (props = {}) => Object.assign(document.createElement(localName), props);
