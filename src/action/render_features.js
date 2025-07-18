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
  const detailsElement = currentTarget.closest('details');
  let {
    [enabledFeaturesKey]: enabledFeatures = [],
    [specialAccessKey]: specialAccess = []
  } = await browser.storage.local.get();

  const hasPreferences = detailsElement.querySelector('.preferences:not(:empty)');
  if (hasPreferences) detailsElement.open = checked;

  if (checked) {
    enabledFeatures.push(id);
    detailsElement.classList.remove('disabled');
  } else {
    enabledFeatures = enabledFeatures.filter(x => x !== id);
    detailsElement.classList.add('disabled');

    if (detailsElement.dataset.deprecated === 'true' && !specialAccess.includes(id)) {
      specialAccess.push(id);
    }
  }

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

const renderFeatures = async function () {
  const featureClones = [];
  featuresDiv.textContent = '';

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
      title = featureName,
      description = '',
      note = '',
      icon = {},
      help = '',
      relatedTerms = [],
      preferences = {},
      deprecated = false
    } = await file.json();

    const featureTemplateClone = document.getElementById('feature').content.cloneNode(true);

    const detailsElement = featureTemplateClone.querySelector('details.feature');
    detailsElement.dataset.relatedTerms = relatedTerms;
    detailsElement.dataset.deprecated = deprecated;

    if (enabledFeatures.includes(featureName) === false) {
      detailsElement.classList.add('disabled');

      if (deprecated && !specialAccess.includes(featureName)) {
        continue;
      }
    }

    if (icon.class_name !== undefined) {
      const iconDiv = featureTemplateClone.querySelector('div.icon');
      iconDiv.style.backgroundColor = icon.background_color || '#ffffff';

      const iconInner = iconDiv.querySelector('i');
      iconInner.classList.add(icon.class_name);
      iconInner.style.color = icon.color || '#000000';
    }

    const titleHeading = featureTemplateClone.querySelector('h4.title');
    titleHeading.textContent = title;

    if (description !== '') {
      const descriptionParagraph = featureTemplateClone.querySelector('p.description');
      descriptionParagraph.textContent = description;
    }

    if (help !== '') {
      const helpLink = featureTemplateClone.querySelector('a.help');
      helpLink.href = help;
    }

    const enabledInput = featureTemplateClone.querySelector('input.toggle-button');
    enabledInput.id = featureName;
    enabledInput.checked = enabledFeatures.includes(featureName);
    enabledInput.addEventListener('input', writeEnabled);

    if (note !== '') {
      const noteParagraph = featureTemplateClone.querySelector('.note');
      noteParagraph.textContent = note;
    }

    if (Object.keys(preferences).length !== 0) {
      const preferenceList = featureTemplateClone.querySelector('.preferences');
      renderPreferences({ featureName, preferences, preferenceList });
    }

    featureClones.push(featureTemplateClone);
  }

  featuresDiv.append(...featureClones);
};

renderFeatures();

configSectionLink.addEventListener('click', ({ currentTarget }) => {
  if (currentTarget.classList.contains('outdated')) {
    currentTarget.classList.remove('outdated');
    renderFeatures();
  }
});
