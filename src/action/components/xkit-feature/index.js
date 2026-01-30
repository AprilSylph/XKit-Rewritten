import { CustomElement, fetchStyleSheets } from '../index.js';
import Coloris from '../../../lib/coloris.min.js';

const localName = 'xkit-feature';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <details>
      <summary>
        <div aria-hidden="true" class="icon">
          <slot name="icon"></slot>
        </div>
        <div class="meta">
          <h4 class="title"><slot name="title"></slot></h4>
          <p class="description"><slot name="description"></slot></p>
        </div>
        <div class="buttons">
          <div class="badge">
            <slot name="badge"></slot>
          </div>
          <input type="checkbox" checked class="toggle-button" aria-label="Enable this feature">
        </div>
      </summary>
      <ul class="preferences"></ul>
    </details>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/coloris.min.css',
  '/lib/normalize.min.css',
  '/lib/remixicon/remixicon.css',
  '/lib/toggle-button.css',
  './index.css',
].map(import.meta.resolve));

/**
 * @typedef BasePreference
 * @property {string} label Label displayed to the user to describe the preference.
 * @property {string} [inherit] The storage key to inherit the value of, if the preference has not been set.
 */

/**
 * @typedef Checkbox
 * @property {"checkbox"} type Type of preference.
 * @property {boolean} default Default value of the preference to display to the user.
 */

/**
 * @typedef Text
 * @property {"text"} type Type of preference.
 * @property {string} default Default value of the preference to display to the user.
 */

/**
 * @typedef TextArea
 * @property {"textarea"} type Type of preference.
 * @property {string} default Default value of the preference to display to the user.
 */

/**
 * @typedef Color
 * @property {"color"} type Type of preference.
 * @property {string} default Default value of the preference to display to the user.
 */

/**
 * @typedef Select
 * @property {"select"} type Type of preference.
 * @property {{ label: string, value: string }[]} options List of options for the user to choose between.
 * @property {string} default Default value of the preference to display to the user. Must match one of the `options` item's `value`.
 */

/**
 * @typedef Iframe
 * @property {"iframe"} type Type of preference.
 * @property {string} src A URL, relative to `src/`, to be embedded in the feature's preference list.
 */

/** @typedef {BasePreference & (Checkbox | Text | TextArea | Color | Select | Iframe)} Preference */
/** @typedef {Record<string, Preference>} Preferences */

class XKitFeatureElement extends CustomElement {
  static #enabledFeaturesKey = 'enabledScripts';
  static #specialAccessKey = 'specialAccess';

  /** @type {HTMLDetailsElement}  */ #detailsElement;
  /** @type {HTMLInputElement}    */ #enabledToggle;
  /** @type {HTMLUListElement}    */ #preferencesList;

  /** @type {boolean}     */ #disabled = false;
  /** @type {boolean}     */ deprecated = false;
  /** @type {string}      */ featureName = '';
  /** @type {Preferences} */ preferences = {};
  /** @type {string[]}    */ relatedTerms = [];

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#detailsElement = this.shadowRoot.querySelector('details');
    this.#enabledToggle = this.shadowRoot.querySelector('input[type="checkbox"]');
    this.#preferencesList = this.shadowRoot.querySelector('ul.preferences');
  }

  /** @param {Event} event `input` or `change` events for any feature preferences. */
  static #writePreference = async ({ currentTarget }) => {
    const { id } = currentTarget;
    const [featureName, preferenceType, preferenceName] = id.split('.');
    const storageKey = `${featureName}.preferences.${preferenceName}`;

    switch (preferenceType) {
      case 'checkbox':
        browser.storage.local.set({ [storageKey]: currentTarget.checked });
        break;
      case 'text':
      case 'color':
      case 'select':
      case 'textarea':
        browser.storage.local.set({ [storageKey]: currentTarget.value });
        break;
    }
  };

  /** @type {() => (event: Event) => void} */
  static #getDebouncedWritePreference = () => {
    let timeoutID;
    return ({ currentTarget }) => {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => XKitFeatureElement.#writePreference({ currentTarget }), 500);
    };
  };

  /** @type {(props: { featureName: string, preferences: Preferences, preferenceList: HTMLUListElement }) => Promise<void>} */
  static #renderPreferences = async ({ featureName, preferences, preferenceList }) => {
    for (const [key, preference] of Object.entries(preferences)) {
      const storageKey = `${featureName}.preferences.${key}`;
      const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);
      preference.value = savedPreference ?? preference.default;

      const preferenceTemplateClone = document.getElementById(`${preference.type}-preference`).content.cloneNode(true);

      const preferenceInput = preferenceTemplateClone.querySelector('input, select, textarea, iframe');
      preferenceInput.id = `${featureName}.${preference.type}.${key}`;

      const preferenceLabel = preferenceTemplateClone.querySelector('label');
      if (preferenceLabel) {
        preferenceLabel.textContent = preference.label || key;
        preferenceLabel.setAttribute('for', `${featureName}.${preference.type}.${key}`);
      } else {
        preferenceInput.title = preference.label || key;
      }

      switch (preference.type) {
        case 'text':
        case 'textarea':
          preferenceInput.addEventListener('input', XKitFeatureElement.#getDebouncedWritePreference());
          break;
        case 'iframe':
          break;
        default:
          preferenceInput.addEventListener('change', XKitFeatureElement.#writePreference);
      }

      switch (preference.type) {
        case 'checkbox':
          preferenceInput.checked = preference.value;
          break;
        case 'select':
          for (const { value, label } of preference.options) {
            const option = Object.assign(document.createElement('option'), {
              value,
              textContent: label,
              selected: value === preference.value,
            });
            preferenceInput.appendChild(option);
          }
          break;
        case 'color':
          preferenceInput.value = preference.value;
          Coloris.init(); // eslint-disable-line import-x/no-named-as-default-member
          Coloris({
            alpha: false,
            clearButton: true,
            closeButton: true,
            el: preferenceInput,
            swatches: ['#ff4930', '#ff8a00', '#00cf35', '#00b8ff', '#7c5cff', '#ff62ce'],
            themeMode: 'auto',
          });
          break;
        case 'iframe':
          preferenceInput.src = preference.src;
          break;
        default:
          preferenceInput.value = preference.value;
      }

      preferenceList.appendChild(preferenceTemplateClone);
    }
  };

  /** @param {InputEvent} event `input` event for the feature's "Enable this feature" toggle. */
  #handleEnabledToggleInput = async ({ currentTarget }) => {
    const { checked, id } = currentTarget;
    let {
      [XKitFeatureElement.#enabledFeaturesKey]: enabledFeatures = [],
      [XKitFeatureElement.#specialAccessKey]: specialAccess = [],
    } = await browser.storage.local.get();

    const hasPreferences = Object.keys(this.preferences).length !== 0;
    if (hasPreferences) this.#detailsElement.open = checked;

    if (checked) {
      enabledFeatures.push(id);
    } else {
      enabledFeatures = enabledFeatures.filter(x => x !== id);

      if (this.deprecated && !specialAccess.includes(id)) {
        specialAccess.push(id);
      }
    }

    this.disabled = !checked;

    browser.storage.local.set({
      [XKitFeatureElement.#enabledFeaturesKey]: enabledFeatures,
      [XKitFeatureElement.#specialAccessKey]: specialAccess,
    });
  };

  connectedCallback () {
    this.#detailsElement.dataset.deprecated = this.deprecated;
    this.#enabledToggle.id = this.featureName;
    this.#enabledToggle.addEventListener('input', this.#handleEnabledToggleInput);
    this.dataset.relatedTerms = this.relatedTerms;

    if (Object.keys(this.preferences).length !== 0) {
      XKitFeatureElement.#renderPreferences({
        featureName: this.featureName,
        preferences: this.preferences,
        preferenceList: this.#preferencesList,
      });
    }
  }

  disconnectedCallback () {
    this.#enabledToggle.removeEventListener('input', this.#handleEnabledToggleInput);
  }

  set disabled (disabled = false) {
    this.#detailsElement.classList.toggle('disabled', disabled);
    this.#enabledToggle.checked = !disabled;
    this.#disabled = disabled;
  }

  get disabled () { return this.#disabled; }
}

customElements.define(localName, XKitFeatureElement);

/**
 * @typedef XKitFeatureProps
 * @property {boolean} [disabled] Whether or not the feature is currently disabled. Defaults to `false`.
 * @property {boolean} deprecated Whether to hide the feature on installations on which it was not enabled at the time of deprecation.
 * @property {string} featureName The feature's internal name (e.g. `"quick_reblog"`).
 * @property {Preferences} [preferences] Record consisting of preference name keys and preference object values.
 * @property {string[]} [relatedTerms] An optional array of strings related to this feature that a user might search for. Case insensitive.
 */

/** @type {(props: XKitFeatureProps) => XKitFeatureElement} */
export const XKitFeature = (props = {}) => Object.assign(document.createElement(localName), props);
