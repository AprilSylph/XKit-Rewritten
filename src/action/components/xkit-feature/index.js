import { CustomElement, fetchStyleSheets } from '../index.js';

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
          <input type="checkbox" checked aria-label="Enable this feature">
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
  '/lib/modern-normalize.css',
  '/lib/remixicon/remixicon.css',
  './index.css',
].map(import.meta.resolve));

class XKitFeatureElement extends CustomElement {
  static #enabledFeaturesKey = 'enabledScripts';
  static #specialAccessKey = 'specialAccess';

  /** @type {HTMLDetailsElement}  */ #detailsElement;
  /** @type {HTMLInputElement}    */ #enabledToggle;

  /** @type {boolean}   */ #disabled = false;
  /** @type {boolean}   */ deprecated = false;
  /** @type {string}    */ featureName = '';
  /** @type {string[]}  */ relatedTerms = [];

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#detailsElement = this.shadowRoot.querySelector('details');
    this.#enabledToggle = this.shadowRoot.querySelector('input[type="checkbox"]');
  }

  /** @param {InputEvent & { currentTarget: HTMLInputElement }} event `input` event for the feature's "Enable this feature" toggle. */
  #handleEnabledToggleInput = async ({ currentTarget: { checked } }) => {
    const {
      [XKitFeatureElement.#enabledFeaturesKey]: enabledFeatures = [],
      [XKitFeatureElement.#specialAccessKey]: specialAccess = [],
    } = await browser.storage.local.get();

    /** @type {Set<string>} */ const enabledFeaturesSet = new Set(enabledFeatures);
    /** @type {Set<string>} */ const specialAccessSet = new Set(specialAccess);

    checked
      ? enabledFeaturesSet.add(this.featureName)
      : enabledFeaturesSet.delete(this.featureName);

    this.deprecated
      ? specialAccessSet.add(this.featureName)
      : specialAccessSet.delete(this.featureName);

    await browser.storage.local.set({
      [XKitFeatureElement.#enabledFeaturesKey]: Array.from(enabledFeaturesSet),
      [XKitFeatureElement.#specialAccessKey]: Array.from(specialAccessSet),
    });

    this.disabled = !checked;

    const hasPreferences = this.querySelector('[slot="preferences"]') !== null;
    if (hasPreferences) this.#detailsElement.open = checked;
  };

  connectedCallback () {
    this.#detailsElement.dataset.deprecated = this.deprecated;
    this.#enabledToggle.addEventListener('input', this.#handleEnabledToggleInput);
    this.dataset.relatedTerms = this.relatedTerms;
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
 * @property {string[]} [relatedTerms] An optional array of strings related to this feature that a user might search for. Case insensitive.
 */

/** @type {(props: XKitFeatureProps) => XKitFeatureElement} */
export const XKitFeature = (props = {}) => Object.assign(document.createElement(localName), props);
