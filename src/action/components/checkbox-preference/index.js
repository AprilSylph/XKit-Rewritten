import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'checkbox-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <input id="checkbox" type="checkbox">
    <label for="checkbox"></label>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  './index.css',
].map(import.meta.resolve));

class CheckboxPreferenceElement extends CustomElement {
  /** @type {string} */ featureName;
  /** @type {string} */ preferenceName;

  /** @type {HTMLInputElement} */ #inputElement;
  /** @type {HTMLLabelElement} */ #labelElement;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#inputElement = this.shadowRoot.getElementById('checkbox');
    this.#labelElement = this.shadowRoot.querySelector('label[for="checkbox"]');
  }

  /** @param {string} label Label displayed to the user to describe the preference. */
  set label (label) { this.#labelElement.textContent = label; }
  get label () { return this.#labelElement.textContent; }

  /** @param {boolean} value Whether or not this preference is enabled. */
  set value (value = false) { this.#inputElement.checked = value; }
  get value () { return this.#inputElement.checked; }

  /** @type {(event: Event) => void} */ #onChange = () => {
    const storageKey = `${this.featureName}.preferences.${this.preferenceName}`;
    const storageValue = this.#inputElement.checked;

    browser.storage.local.set({ [storageKey]: storageValue });
  };

  connectedCallback () {
    this.role ||= 'listitem';
    this.slot ||= 'preferences';
    this.#inputElement.addEventListener('change', this.#onChange);
  }

  disconnectedCallback () {
    this.#inputElement.removeEventListener('change', this.#onChange);
  }
}

customElements.define(localName, CheckboxPreferenceElement);

/**
 * @typedef {object} CheckboxPreferenceProps
 * @property {string} featureName The feature's internal name (e.g. `"quick_reblog"`).
 * @property {string} preferenceName The preference's internal name (e.g. `"showTagSuggestions"`).
 * @property {string} label The preference's label (e.g. `"Suggest tags from the post being reblogged"`).
 * @property {boolean} value The preference's current value (as set by the user, or the preference's default).
 */

/** @type {(props: CheckboxPreferenceProps) => CheckboxPreferenceElement} */
export const CheckboxPreference = (props = {}) => Object.assign(document.createElement(localName), props);
