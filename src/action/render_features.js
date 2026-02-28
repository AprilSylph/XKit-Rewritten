import { CheckboxPreference } from './components/checkbox-preference/index.js';
import { ColorPreference } from './components/color-preference/index.js';
import { IframePreference } from './components/iframe-preference/index.js';
import { SelectPreference } from './components/select-preference/index.js';
import { TextPreference } from './components/text-preference/index.js';
import { TextAreaPreference } from './components/textarea-preference/index.js';
import { XKitFeature } from './components/xkit-feature/index.js';

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

const renderFeatures = async function () {
  const featureElements = [];

  const installedFeatures = await getInstalledFeatures();
  const {
    [enabledFeaturesKey]: enabledFeatures = [],
    [specialAccessKey]: specialAccess = [],
  } = await browser.storage.local.get();

  const orderedEnabledFeatures = installedFeatures.filter(featureName => enabledFeatures.includes(featureName));
  const disabledFeatures = installedFeatures.filter(featureName => enabledFeatures.includes(featureName) === false);

  for (const featureName of [...orderedEnabledFeatures, ...disabledFeatures]) {
    const url = browser.runtime.getURL(`/features/${featureName}/feature.json`);
    const file = await fetch(url);
    const { title, description, icon, help, preferences, ...metadata } = await file.json();

    const disabled = enabledFeatures.includes(featureName) === false;
    if (disabled && metadata.deprecated && !specialAccess.includes(featureName)) {
      continue;
    }

    const featureElement = XKitFeature({ disabled, featureName, ...metadata });

    if (title) {
      const titleElement = document.createElement('span');
      titleElement.setAttribute('slot', 'title');
      titleElement.textContent = title;
      featureElement.append(titleElement);
    }

    if (description) {
      const descriptionElement = document.createElement('span');
      descriptionElement.setAttribute('slot', 'description');
      descriptionElement.textContent = description;
      featureElement.append(descriptionElement);
    }

    if (icon.class_name) {
      const iconElement = document.createElement('i');
      iconElement.setAttribute('slot', 'icon');
      iconElement.classList.add('ri-fw', icon.class_name);
      iconElement.style.backgroundColor = icon.background_color ?? '#ffffff';
      iconElement.style.color = icon.color ?? '#000000';
      featureElement.append(iconElement);
    }

    if (metadata.deprecated) {
      const iconElement = document.createElement('i');
      iconElement.setAttribute('slot', 'badge');
      iconElement.setAttribute('aria-label', 'Deprecated');
      iconElement.setAttribute('title', 'This feature is deprecated.');
      iconElement.classList.add('ri-fw', 'ri-alert-fill');
      iconElement.style.color = '#ff8a00';
      iconElement.style.cursor = 'auto';
      iconElement.style.fontSize = '1.25rem';
      featureElement.append(iconElement);
    } else if (help) {
      const anchorElement = document.createElement('a');
      anchorElement.setAttribute('slot', 'badge');
      anchorElement.setAttribute('aria-label', 'Help');
      anchorElement.setAttribute('href', help);
      anchorElement.setAttribute('target', '_blank');
      featureElement.append(anchorElement);

      const iconElement = document.createElement('i');
      iconElement.setAttribute('aria-hidden', 'true');
      iconElement.classList.add('ri-fw', 'ri-question-fill');
      iconElement.style.color = 'rgb(var(--black))';
      iconElement.style.fontSize = '1.25rem';
      anchorElement.append(iconElement);
    } else {
      const spanElement = document.createElement('span');
      spanElement.setAttribute('slot', 'badge');
      spanElement.textContent = 'New!';
      featureElement.append(spanElement);
    }

    if (preferences) {
      const preferenceElements = [];

      for (const [preferenceName, preference] of Object.entries(preferences)) {
        const storageKey = `${featureName}.preferences.${preferenceName}`;
        const { [storageKey]: storageValue } = await browser.storage.local.get(storageKey);

        const label = preference.label ?? preferenceName;
        const options = preference.options ?? [];
        const src = preference.src ?? '';
        const value = storageValue ?? preference.default;

        switch (preference.type) {
          case 'checkbox':
            preferenceElements.push(CheckboxPreference({ featureName, preferenceName, label, value }));
            break;
          case 'color':
            preferenceElements.push(ColorPreference({ featureName, preferenceName, label, value }));
            break;
          case 'iframe':
            preferenceElements.push(IframePreference({ label, src }));
            break;
          case 'select':
            preferenceElements.push(SelectPreference({ featureName, preferenceName, label, options, value }));
            break;
          case 'text':
            preferenceElements.push(TextPreference({ featureName, preferenceName, label, value }));
            break;
          case 'textarea':
            preferenceElements.push(TextAreaPreference({ featureName, preferenceName, label, value }));
            break;
          default:
            console.error(`Cannot render preference "${storageKey}": Unsupported type "${preference.type}"`);
        }
      }

      featureElement.append(...preferenceElements);
    }

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
