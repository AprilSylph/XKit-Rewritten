import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'percent-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <label for="percent"></label>
    <input id="percent" type="number" inputmode="numeric" min="0" max="100" required>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  '/action/acorn.css',
  './index.css',
].map(import.meta.resolve));

class PercentPreferenceElement extends CustomElement {
  /** @type {string} */ featureName;
  /** @type {string} */ preferenceName;

  /** @type {HTMLInputElement} */ #inputElement;
  /** @type {HTMLLabelElement} */ #labelElement;
  /** @type {ReturnType<Window['setTimeout']>} */ #timeoutID;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#inputElement = this.shadowRoot.getElementById('percent');
    this.#labelElement = this.shadowRoot.querySelector('label[for="percent"]');
  }

  /** @param {string} label Label displayed to the user to describe the preference. */
  set label (label) { this.#labelElement.textContent = label; }
  get label () { return this.#labelElement.textContent; }

  /** @param {string | number} value The saved or default value of this preference. */
  set value (value = 0) {
    typeof value === 'number'
      ? this.#inputElement.valueAsNumber = value
      : this.#inputElement.value = value;
  }

  /** @returns {number} The current value of this preference. */
  get value () { return this.#inputElement.valueAsNumber; }

  /** @type {(event: InputEvent) => void} */ #onInput = () => {
    clearTimeout(this.#timeoutID);
    this.#timeoutID = setTimeout(() => {
      if (this.#inputElement.reportValidity() === false) return;

      const storageKey = `${this.featureName}.preferences.${this.preferenceName}`;
      browser.storage.local.set({ [storageKey]: this.#inputElement.valueAsNumber });
    }, 500);
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

customElements.define(localName, PercentPreferenceElement);

/**
 * @typedef PercentPreferenceProps
 * @property {string} featureName The feature's internal name (e.g. `"vanilla_audio"`).
 * @property {string} preferenceName The preference's internal name (e.g. `"defaultVolume"`).
 * @property {string} label The preference's label (e.g. `"Default Volume"`).
 * @property {string} value The preference's current value (as set by the user, or the preference's default).
 */

/** @type {(props: PercentPreferenceProps) => PercentPreferenceElement} */
export const PercentPreference = (props = {}) => Object.assign(document.createElement(localName), props);
