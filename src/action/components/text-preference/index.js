import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'text-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <label for="text"></label>
    <input id="text" type="text" size="28" spellcheck="false">
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  './index.css',
].map(import.meta.resolve));

class TextPreferenceElement extends CustomElement {
  /** @type {string} */ featureName;
  /** @type {string} */ preferenceName;

  /** @type {HTMLInputElement} */ #inputElement;
  /** @type {HTMLLabelElement} */ #labelElement;
  /** @type {ReturnType<Window['setTimeout']>} */ #timeoutID;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#inputElement = this.shadowRoot.getElementById('text');
    this.#labelElement = this.shadowRoot.querySelector('label[for="text"]');
  }

  /** @param {string} label Label displayed to the user to describe the preference. */
  set label (label) { this.#labelElement.textContent = label; }
  get label () { return this.#labelElement.textContent; }

  /** @param {string} value The saved or default value of this preference. */
  set value (value = '') { this.#inputElement.value = value; }
  get value () { return this.#inputElement.value; }

  /** @type {(event: InputEvent) => void} */ #onInput = () => {
    const storageKey = `${this.featureName}.preferences.${this.preferenceName}`;
    const storageValue = this.#inputElement.value;

    clearTimeout(this.#timeoutID);
    this.#timeoutID = setTimeout(() => browser.storage.local.set({ [storageKey]: storageValue }), 500);
  };

  connectedCallback () {
    this.role ||= 'listitem';
    this.slot ||= 'preferences';
    this.#inputElement.addEventListener('input', this.#onInput);
  }

  disconnectedCallback () {
    this.#inputElement.removeEventListener('input', this.#onInput);
  }
}

customElements.define(localName, TextPreferenceElement);

/**
 * @typedef TextPreferenceProps
 * @property {string} featureName The feature's internal name (e.g. `"quick_tags"`).
 * @property {string} preferenceName The preference's internal name (e.g. `"originalPostTag"`).
 * @property {string} label The preference's label (e.g. `"Original post tag"`).
 * @property {string} value The preference's current value (as set by the user, or the preference's default).
 */

/** @type {(props: TextPreferenceProps) => TextPreferenceElement} */
export const TextPreference = (props = {}) => Object.assign(document.createElement(localName), props);
