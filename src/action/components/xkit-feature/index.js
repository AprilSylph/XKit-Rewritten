import { CheckboxPreference } from '../checkbox-preference/index.js';
import { ColorPreference } from '../color-preference/index.js';
import { IframePreference } from '../iframe-preference/index.js';
import { CustomElement, fetchStyleSheets } from '../index.js';
import { SelectPreference } from '../select-preference/index.js';
import { TextPreference } from '../text-preference/index.js';
import { TextAreaPreference } from '../textarea-preference/index.js';

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
      <ul class="preferences">
        <slot name="preferences">
          <span id="empty">No preferences available for this feature.</span>
        </slot>
      </ul>
    </details>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
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
 * @property {string} default For `"select"`-type preferences, must match one of the `options` item's `value`.
 */

/**
 * @typedef Iframe
 * @property {"iframe"} type Type of preference.
 * @property {string} src A page URL, relative to `src/`, to be embedded in the feature's preference list.
 * @property {never} default Not supported on `"iframe"`-type preferences.
 */

/** @typedef {BasePreference & (Checkbox | Text | TextArea | Color | Select | Iframe)} Preference */
/** @typedef {Record<string, Preference>} Preferences */

class XKitFeatureElement extends CustomElement {
  static #enabledFeaturesKey = 'enabledScripts';
  static #specialAccessKey = 'specialAccess';

  /** @type {HTMLDetailsElement}  */ #detailsElement;
  /** @type {HTMLInputElement}    */ #enabledToggle;

  /** @type {boolean}     */ #disabled = false;
  /** @type {boolean}     */ deprecated = false;
  /** @type {string}      */ featureName = '';
  /** @type {Preferences} */ preferences = {};
  /** @type {string[]}    */ relatedTerms = [];

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#detailsElement = this.shadowRoot.querySelector('details');
    this.#enabledToggle = this.shadowRoot.querySelector('input[type="checkbox"]');
  }

  #renderPreferences = async () => {
    const { featureName } = this;

    for (const [preferenceName, preference] of Object.entries(this.preferences)) {
      const storageKey = `${featureName}.preferences.${preferenceName}`;
      const { [storageKey]: storageValue } = await browser.storage.local.get(storageKey);

      const label = preference.label ?? preferenceName;
      const options = preference.options ?? [];
      const src = preference.src ?? '';
      const value = storageValue ?? preference.default;

      switch (preference.type) {
        case 'checkbox':
          this.append(CheckboxPreference({ featureName, preferenceName, label, value }));
          break;
        case 'color':
          this.append(ColorPreference({ featureName, preferenceName, label, value }));
          break;
        case 'iframe':
          this.append(IframePreference({ label, src }));
          break;
        case 'select':
          this.append(SelectPreference({ featureName, preferenceName, label, options, value }));
          break;
        case 'text':
          this.append(TextPreference({ featureName, preferenceName, label, value }));
          break;
        case 'textarea':
          this.append(TextAreaPreference({ featureName, preferenceName, label, value }));
          break;
        default:
          console.error(`Cannot render preference "${storageKey}": Unsupported type "${preference.type}"`);
      }
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

    this.#renderPreferences();
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
