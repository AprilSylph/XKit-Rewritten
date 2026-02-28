import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'textarea-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <label for="textarea"></label>
    <textarea id="textarea" rows="5" spellcheck="false"></textarea>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  './index.css',
].map(import.meta.resolve));

class TextAreaPreferenceElement extends CustomElement {
  /** @type {string} */ featureName;
  /** @type {string} */ preferenceName;

  /** @type {HTMLTextAreaElement} */ #textAreaElement;
  /** @type {HTMLLabelElement}    */ #labelElement;
  /** @type {ReturnType<Window['setTimeout']>} */ #timeoutID;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#textAreaElement = this.shadowRoot.getElementById('textarea');
    this.#labelElement = this.shadowRoot.querySelector('label[for="textarea"]');
  }

  /** @param {string} label Label displayed to the user to describe the preference. */
  set label (label) { this.#labelElement.textContent = label; }
  get label () { return this.#labelElement.textContent; }

  /** @param {string} value The saved or default value of this preference. */
  set value (value = '') { this.#textAreaElement.value = value; }
  get value () { return this.#textAreaElement.value; }

  /** @type {(event: InputEvent) => void} */ #onInput = () => {
    const storageKey = `${this.featureName}.preferences.${this.preferenceName}`;
    const storageValue = this.#textAreaElement.value;

    clearTimeout(this.#timeoutID);
    this.#timeoutID = setTimeout(() => browser.storage.local.set({ [storageKey]: storageValue }), 500);
  };

  connectedCallback () {
    this.role ||= 'listitem';
    this.slot ||= 'preferences';
    this.#textAreaElement.addEventListener('input', this.#onInput);
  }

  disconnectedCallback () {
    this.#textAreaElement.removeEventListener('input', this.#onInput);
  }
}

customElements.define(localName, TextAreaPreferenceElement);

/**
 * @typedef TextAreaPreferenceProps
 * @property {string} featureName The feature's internal name (e.g. `"show_originals"`).
 * @property {string} preferenceName The preference's internal name (e.g. `"whitelistedUsernames"`).
 * @property {string} label The preference's label (e.g. `"Always show reblogs from these blogs (comma-separated)"`).
 * @property {string} value The preference's current value (as set by the user, or the preference's default).
 */

/** @type {(props: TextAreaPreferenceProps) => TextAreaPreferenceElement} */
export const TextAreaPreference = (props = {}) => Object.assign(document.createElement(localName), props);
