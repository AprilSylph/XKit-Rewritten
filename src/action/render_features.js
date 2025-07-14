const configSection = document.getElementById('configuration');
const configSectionLink = document.querySelector('a[href="#configuration"]');
const featuresDiv = configSection.querySelector('.features');

const enabledFeaturesKey = 'enabledScripts';
const specialAccessKey = 'specialAccess';

const getInstalledFeatures = async function () {
  const url = browser.runtime.getURL('/features/index.json');
  const file = await fetch(url);
  const installedFeatures = await file.json();

  return installedFeatures;
};

const debounce = (func, ms) => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), ms);
  };
};

const writePreference = async function ({ target }) {
  const { id } = target;
  const [featureName, preferenceType, preferenceName] = id.split('.');
  const storageKey = `${featureName}.preferences.${preferenceName}`;

  switch (preferenceType) {
    case 'checkbox':
      browser.storage.local.set({ [storageKey]: target.checked });
      break;
    case 'text':
    case 'color':
    case 'select':
    case 'textarea':
      browser.storage.local.set({ [storageKey]: target.value });
      break;
  }
};

const renderPreferences = async function ({ featureName, preferences, preferenceList }) {
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
        preferenceInput.addEventListener('input', debounce(writePreference, 500));
        break;
      case 'iframe':
        break;
      default:
        preferenceInput.addEventListener('input', writePreference);
    }

    switch (preference.type) {
      case 'checkbox':
        preferenceInput.checked = preference.value;
        break;
      case 'select':
        for (const { value, label } of preference.options) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          option.selected = value === preference.value;
          preferenceInput.appendChild(option);
        }
        break;
      case 'color':
        preferenceInput.value = preference.value;
        $(preferenceInput)
          .on('change.spectrum', writePreference)
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

class XKitFeatureElement extends HTMLElement {
  #detailsElement;
  #enabledToggle;
  #helpAnchor;
  #preferencesList;

  #handleEnabledToggleInput = async ({ currentTarget }) => {
    const { checked, id } = currentTarget;
    let {
      [enabledFeaturesKey]: enabledFeatures = [],
      [specialAccessKey]: specialAccess = []
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
      [enabledFeaturesKey]: enabledFeatures,
      [specialAccessKey]: specialAccess
    });
  };

  deprecated = false;
  description = '';
  featureName = '';
  help = '';
  icon = {};
  preferences = {};
  relatedTerms = [];
  title = '';

  constructor () {
    super();

    const { content } = document.getElementById(this.localName);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.replaceChildren(content.cloneNode(true));

    this.#detailsElement = shadowRoot.querySelector('details');
    this.#enabledToggle = shadowRoot.querySelector('input[type="checkbox"]');
    this.#helpAnchor = shadowRoot.querySelector('a.help');
    this.#preferencesList = shadowRoot.querySelector('ul.preferences');
  }

  connectedCallback () {
    this.#detailsElement.dataset.deprecated = this.deprecated;
    this.#enabledToggle.id = this.featureName;
    this.#enabledToggle.addEventListener('input', this.#handleEnabledToggleInput);
    this.#helpAnchor.href = this.help;
    this.dataset.relatedTerms = this.relatedTerms;

    const children = [];

    if (this.description) {
      const descriptionElement = document.createElement('span');
      descriptionElement.setAttribute('slot', 'description');
      descriptionElement.textContent = this.description;
      children.push(descriptionElement);
    }

    if (this.icon.class_name) {
      const iconElement = document.createElement('i');
      iconElement.setAttribute('slot', 'icon');
      iconElement.classList.add('ri-fw', this.icon.class_name);
      iconElement.style.backgroundColor = this.icon.background_color ?? '#ffffff';
      iconElement.style.color = this.icon.color ?? '#000000';
      children.push(iconElement);
    }

    if (this.title) {
      const titleElement = document.createElement('span');
      titleElement.setAttribute('slot', 'title');
      titleElement.textContent = this.title;
      children.push(titleElement);
    }

    this.replaceChildren(...children);

    if (Object.keys(this.preferences).length !== 0) {
      renderPreferences({
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

customElements.define('xkit-feature', XKitFeatureElement);

const renderFeatures = async function () {
  const featureElements = [];

  const installedFeatures = await getInstalledFeatures();
  const {
    [enabledFeaturesKey]: enabledFeatures = [],
    [specialAccessKey]: specialAccess = []
  } = await browser.storage.local.get();

  const orderedEnabledFeatures = installedFeatures.filter(featureName => enabledFeatures.includes(featureName));
  const disabledFeatures = installedFeatures.filter(featureName => enabledFeatures.includes(featureName) === false);

  for (const featureName of [...orderedEnabledFeatures, ...disabledFeatures]) {
    const url = browser.runtime.getURL(`/features/${featureName}/feature.json`);
    const file = await fetch(url);
    const metadata = await file.json();

    const disabled = enabledFeatures.includes(featureName) === false;
    if (disabled && metadata.deprecated && !specialAccess.includes(featureName)) {
      continue;
    }

    const featureElement = document.createElement('xkit-feature');
    Object.assign(featureElement, { disabled, featureName, ...metadata });
    featureElements.push(featureElement);
  }

  featuresDiv.replaceChildren(...featureElements);
};

renderFeatures();

configSectionLink.addEventListener('click', ({ currentTarget }) => {
  if (currentTarget.classList.contains('outdated')) {
    currentTarget.classList.remove('outdated');
    renderFeatures();
  }
});
