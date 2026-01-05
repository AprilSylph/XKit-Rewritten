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
          <input type="checkbox" checked class="toggle-button" aria-label="Enable this feature">
        </div>
      </summary>
      <ul class="preferences"></ul>
    </details>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/normalize.min.css',
  '/lib/remixicon/remixicon.css',
  '/lib/spectrum.css',
  '/lib/toggle-button.css',
  './index.css'
].map(import.meta.resolve));

class XKitFeatureElement extends CustomElement {
  #enabledFeaturesKey = 'enabledScripts';
  #specialAccessKey = 'specialAccess';

  #detailsElement;
  #enabledToggle;
  #preferencesList;

  deprecated = false;
  featureName = '';
  preferences = {};
  relatedTerms = [];

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#detailsElement = this.shadowRoot.querySelector('details');
    this.#enabledToggle = this.shadowRoot.querySelector('input[type="checkbox"]');
    this.#preferencesList = this.shadowRoot.querySelector('ul.preferences');
  }

  #writePreference = async ({ currentTarget }) => {
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

  #getDebouncedWritePreference = () => {
    let timeoutID;
    return ({ currentTarget }) => {
      clearTimeout(timeoutID);
      timeoutID = setTimeout(() => this.#writePreference({ currentTarget }), 500);
    };
  };

  #renderPreferences = async ({ featureName, preferences, preferenceList }) => {
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
          preferenceInput.addEventListener('input', this.#getDebouncedWritePreference());
          break;
        case 'iframe':
          break;
        default:
          preferenceInput.addEventListener('change', this.#writePreference);
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
              selected: value === preference.value
            });
            preferenceInput.appendChild(option);
          }
          break;
        case 'color':
          preferenceInput.value = preference.value;
          $(preferenceInput)
            .on('change.spectrum', this.#writePreference)
            .spectrum({
              preferredFormat: 'hex',
              showInput: true,
              showInitial: true,
              allowEmpty: true
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

  #handleEnabledToggleInput = async ({ currentTarget }) => {
    const { checked, id } = currentTarget;
    let {
      [this.#enabledFeaturesKey]: enabledFeatures = [],
      [this.#specialAccessKey]: specialAccess = []
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
      [this.#enabledFeaturesKey]: enabledFeatures,
      [this.#specialAccessKey]: specialAccess
    });
  };

  connectedCallback () {
    this.#detailsElement.dataset.deprecated = this.deprecated;
    this.#enabledToggle.id = this.featureName;
    this.#enabledToggle.addEventListener('input', this.#handleEnabledToggleInput);
    this.dataset.relatedTerms = this.relatedTerms;

    if (Object.keys(this.preferences).length !== 0) {
      this.#renderPreferences({
        featureName: this.featureName,
        preferences: this.preferences,
        preferenceList: this.#preferencesList
      });
    }
  }

  disconnectedCallback () {
    this.#enabledToggle.removeEventListener('input', this.#handleEnabledToggleInput);
  }

  /** @type {boolean} True if the feature can be enabled. Defaults to `false`. */
  #disabled = false;

  set disabled (disabled = false) {
    this.#detailsElement.classList.toggle('disabled', disabled);
    this.#enabledToggle.checked = !disabled;
    this.#disabled = disabled;
  }

  get disabled () { return this.#disabled; }
}

customElements.define(localName, XKitFeatureElement);

export const XKitFeature = (props = {}) => Object.assign(document.createElement(localName), props);
