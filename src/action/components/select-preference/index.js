import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'select-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <label for="select"></label>
    <select id="select"></select>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/normalize.min.css',
  './index.css',
].map(import.meta.resolve));

/** @typedef {{ label: string, value: string }} Option */

/** @type {(option: Option) => HTMLOptionElement} */
const createOptionElement = ({ label, value }) => Object.assign(document.createElement('option'), { textContent: label, value });

/** @type {(optionElement: HTMLOptionElement) => Option} */
const getOptionObject = ({ textContent, value }) => ({ label: textContent, value });

class SelectPreferenceElement extends CustomElement {
  /** @type {string} */ featureName;
  /** @type {string} */ preferenceName;

  /** @type {HTMLSelectElement} */ #selectElement;
  /** @type {HTMLLabelElement}  */ #labelElement;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#selectElement = this.shadowRoot.getElementById('select');
    this.#labelElement = this.shadowRoot.querySelector('label[for="select"]');
  }

  /** @param {string} label Label displayed to the user to describe the preference. */
  set label (label) { this.#labelElement.textContent = label; }
  get label () { return this.#labelElement.textContent; }

  /** @param {Option[]} options List of options for the user to choose between. */
  set options (options = []) { this.#selectElement.replaceChildren(...options.map(createOptionElement)); }
  get options () { return [...this.#selectElement.options].map(getOptionObject); }

  /** @param {string} value The saved or default value of this preference. Must match one of the `options` item's `value`. */
  set value (value = '') { this.#selectElement.value = value; }
  get value () { return this.#selectElement.value; }

  /** @type {(event: Event) => void} */ #onChange = () => {
    const storageKey = `${this.featureName}.preferences.${this.preferenceName}`;
    const storageValue = this.#selectElement.value;

    browser.storage.local.set({ [storageKey]: storageValue });
  };

  connectedCallback () {
    this.role ||= 'listitem';
    this.slot ||= 'preferences';
    this.#selectElement.addEventListener('change', this.#onChange);
  }

  disconnectedCallback () {
    this.#selectElement.removeEventListener('change', this.#onChange);
  }
}

customElements.define(localName, SelectPreferenceElement);

/**
 * @typedef SelectPreferenceProps
 * @property {string} featureName The feature's internal name (e.g. `"vanilla_audio"`).
 * @property {string} preferenceName The preference's internal name (e.g. `"defaultVolume"`).
 * @property {string} label The preference's label (e.g. `"Default Volume"`).
 * @property {Option[]} options List of options for the user to choose between.
 * @property {string} value The preference's current value (as set by the user, or the preference's default). Must match one of the `options` item's `value`.
 */

/** @type {(props: SelectPreferenceProps) => SelectPreferenceElement} */
export const SelectPreference = (props = {}) => Object.assign(document.createElement(localName), props);
