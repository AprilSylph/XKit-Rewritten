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

const writeEnabled = async function ({ currentTarget }) {
  const { checked, id } = currentTarget;
  const shadowRoot = currentTarget.getRootNode();
  const featureElement = shadowRoot.host;
  let {
    [enabledFeaturesKey]: enabledFeatures = [],
    [specialAccessKey]: specialAccess = []
  } = await browser.storage.local.get();

  const hasPreferences = Object.keys(featureElement.preferences).length !== 0;
  if (hasPreferences) shadowRoot.querySelector('details').open = checked;

  if (checked) {
    enabledFeatures.push(id);
  } else {
    enabledFeatures = enabledFeatures.filter(x => x !== id);

    if (featureElement.deprecated && !specialAccess.includes(id)) {
      specialAccess.push(id);
    }
  }

  featureElement.disabled = !checked;

  browser.storage.local.set({
    [enabledFeaturesKey]: enabledFeatures,
    [specialAccessKey]: specialAccess
  });
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
  #enabledInput;
  #helpAnchor;
  #preferencesList;

  constructor () {
    super();

    const { content } = document.getElementById(this.localName);
    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.replaceChildren(content.cloneNode(true));

    this.#detailsElement = shadowRoot.querySelector('details');
    this.#enabledInput = shadowRoot.querySelector('input[type="checkbox"]');
    this.#helpAnchor = shadowRoot.querySelector('a.help');
    this.#preferencesList = shadowRoot.querySelector('ul.preferences');
  }

  connectedCallback () {
    this.#enabledInput.addEventListener('input', writeEnabled);
  }

  disconnectedCallback () {
    this.#enabledInput.removeEventListener('input', writeEnabled);
  }

  /** @type {boolean} Whether to hide the feature on installations on which it was not enabled at the time of deprecation. */
  #deprecated = false;

  set deprecated (deprecated = false) {
    this.#detailsElement.dataset.deprecated = deprecated;
    this.#deprecated = deprecated;
  }

  get deprecated () { return this.#deprecated; }

  /** @type {boolean} True if the feature can be enabled. Defaults to `false`. */
  #disabled = false;

  set disabled (disabled = false) {
    this.#detailsElement.classList.toggle('disabled', disabled);
    this.#enabledInput.checked = !disabled;
    this.#disabled = disabled;
  }

  get disabled () { return this.#disabled; }

  /** @type {string} The internal name of the feature. Required; has no default. */
  #featureName;

  set featureName (featureName) {
    this.#enabledInput.id = featureName;
    this.#featureName = featureName;
  }

  get featureName () {
    return this.#featureName ?? '';
  }

  /** @type {string} URL which points to a usage guide or extended description for the feature. */
  #help;

  set help (help) {
    if (!help) return;
    this.#helpAnchor.href = help;
    this.#help = help;
  }

  get help () {
    return this.#help ?? '';
  }

  /** @type {Record<string, object>} Keys are preference names; values are preference definitions. */
  #preferences = {};

  set preferences (preferences = {}) {
    if (Object.keys(preferences).length === 0) return;

    renderPreferences({
      featureName: this.#featureName,
      preferences,
      preferenceList: this.#preferencesList
    });

    this.#preferences = preferences;
  }

  get preferences () {
    return this.#preferences;
  }

  /** @type {string[]} An optional array of strings related to this feature that a user might search for. Case insensitive. */
  #relatedTerms = [];

  set relatedTerms (relatedTerms = []) {
    this.#detailsElement.dataset.relatedTerms = relatedTerms;
    this.#relatedTerms = relatedTerms;
  }

  get relatedTerms () {
    return this.#relatedTerms;
  }

  render ({
    description = '',
    icon = {},
    title = this.#featureName
  }) {
    const children = [];

    if (description) {
      const descriptionElement = document.createElement('span');
      descriptionElement.setAttribute('slot', 'description');
      descriptionElement.textContent = description;
      children.push(descriptionElement);
    }

    if (icon.class_name) {
      const iconElement = document.createElement('i');
      iconElement.setAttribute('slot', 'icon');
      iconElement.classList.add('ri-fw', icon.class_name);
      iconElement.style.backgroundColor = icon.background_color ?? '#ffffff';
      iconElement.style.color = icon.color ?? '#000000';
      children.push(iconElement);
    }

    if (title) {
      const titleElement = document.createElement('span');
      titleElement.setAttribute('slot', 'title');
      titleElement.textContent = title;
      children.push(titleElement);
    }

    this.replaceChildren(...children);
  }
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
    const {
      deprecated,
      description,
      help,
      icon,
      preferences,
      relatedTerms,
      title
    } = await file.json();

    const disabled = enabledFeatures.includes(featureName) === false;
    if (disabled && deprecated && !specialAccess.includes(featureName)) {
      continue;
    }

    const featureElement = document.createElement('xkit-feature');
    Object.assign(featureElement, { deprecated, disabled, featureName, help, preferences, relatedTerms });
    featureElement.render({ description, icon, title });

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
