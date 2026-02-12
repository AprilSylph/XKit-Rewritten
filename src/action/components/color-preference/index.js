import Coloris from '../../../lib/coloris.js';
import { CustomElement, fetchStyleSheets } from '../index.js';

const localName = 'color-preference';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <span>
      <input id="color" type="text" size="10" spellcheck="false">
    </span>
    <label for="color"></label>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/coloris.css',
  '/lib/normalize.min.css',
  './index.css',
].map(import.meta.resolve));

class ColorPreferenceElement extends CustomElement {
  /** @type {string} */ featureName;
  /** @type {string} */ preferenceName;

  /** @type {HTMLInputElement} */ #inputElement;
  /** @type {HTMLLabelElement} */ #labelElement;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#inputElement = this.shadowRoot.getElementById('color');
    this.#labelElement = this.shadowRoot.querySelector('label[for="color"]');

    Coloris.init(); // eslint-disable-line import-x/no-named-as-default-member
  }

  /** @param {string} label Label displayed to the user to describe the preference. */
  set label (label) { this.#labelElement.textContent = label; }
  get label () { return this.#labelElement.textContent; }

  /** @param {string} value The saved or default value of this preference. */
  set value (value = '') { this.#inputElement.value = value; }
  get value () { return this.#inputElement.value; }

  /** @type {(event: Event) => void} */ #onChange = () => {
    const storageKey = `${this.featureName}.preferences.${this.preferenceName}`;
    const storageValue = this.#inputElement.value;

    browser.storage.local.set({ [storageKey]: storageValue });
  };

  connectedCallback () {
    this.role ||= 'listitem';
    this.slot ||= 'preferences';
    this.#inputElement.addEventListener('change', this.#onChange);

    Coloris({
      alpha: false,
      clearButton: true,
      closeButton: true,
      el: this.#inputElement,
      swatches: ['#ff4930', '#ff8a00', '#00cf35', '#00b8ff', '#7c5cff', '#ff62ce'],
      themeMode: 'auto',
    });
  }

  disconnectedCallback () {
    this.#inputElement.removeEventListener('change', this.#onChange);
  }
}

customElements.define(localName, ColorPreferenceElement);

/**
 * @typedef {object} ColorPreferenceProps
 * @property {string} featureName The feature's internal name (e.g. `"painter"`).
 * @property {string} preferenceName The preference's internal name (e.g. `"reblogColour"`).
 * @property {string} label The preference's label (e.g. `"Reblogged post colour"`).
 * @property {boolean} value The preference's current value (as set by the user, or the preference's default).
 */

/** @type {(props: ColorPreferenceProps) => ColorPreferenceElement} */
export const ColorPreference = (props = {}) => Object.assign(document.createElement(localName), props);
