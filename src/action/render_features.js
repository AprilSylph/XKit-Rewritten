import { CheckboxPreference } from './components/checkbox-preference/index.js';
import { ColorPreference } from './components/color-preference/index.js';
import { IframePreference } from './components/iframe-preference/index.js';
import { SelectPreference } from './components/select-preference/index.js';
import { TextPreference } from './components/text-preference/index.js';
import { TextAreaPreference } from './components/textarea-preference/index.js';
import { XKitFeature } from './components/xkit-feature/index.js';

const configPanel = document.getElementById('configuration-panel');
const configTab = document.getElementById('configuration-tab');
const featuresDiv = configPanel.querySelector('.features');

const enabledFeaturesKey = 'enabledScripts';
const specialAccessKey = 'specialAccess';

const helpIcon = new DOMParser().parseFromString(`
  <!-- https://mozilla.org/MPL/2.0/ | https://github.com/FirefoxUX/acorn-icons/blob/d6ee428/icons/desktop/16/svg/help-fill-16.svg -->
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="var(--icon-color)" aria-hidden="true">
    <path d="M8 0c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8m-.75 11.25v1.5h1.5v-1.5zM8 3.661a2.56 2.56 0 0 0-2.56 2.56h1.5a1.06 1.06 0 1 1 1.51.96l-.127.065c-.621.342-1.072.987-1.072 1.765v.74l1.501-.002-.001-.74c0-.176.109-.363.334-.468V8.54A2.562 2.562 0 0 0 8 3.661" />
  </svg>
`, 'image/svg+xml').firstElementChild;

const deprecatedIcon = new DOMParser().parseFromString(`
  <!-- https://mozilla.org/MPL/2.0/ | https://github.com/FirefoxUX/acorn-icons/blob/a0be4e8/icons/desktop/16/svg/warning-fill-16.svg -->
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="var(--icon-color-warning)" role="note" aria-label="This feature is deprecated.">
    <title>This feature is deprecated.</title>
    <path d="M15.245 12.028 9.713 2.081a1.98 1.98 0 0 0-1.747-1.028A1.98 1.98 0 0 0 6.213 2.09L.75 12.037C.018 13.37.982 15 2.503 15h10.994c1.525 0 2.489-1.639 1.748-2.972M8.75 12.5h-1.5V11h1.5zm0-3h-1.5v-4h1.5z" />
  </svg>
`, 'image/svg+xml').firstElementChild;

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
      const iconElement = deprecatedIcon.cloneNode(true);
      iconElement.setAttribute('slot', 'badge');
      featureElement.append(iconElement);
    } else if (help) {
      const anchorElement = document.createElement('a');
      anchorElement.setAttribute('slot', 'badge');
      anchorElement.setAttribute('aria-label', 'Help');
      anchorElement.setAttribute('href', help);
      anchorElement.setAttribute('target', '_blank');
      anchorElement.setAttribute('title', 'Help');
      anchorElement.append(helpIcon.cloneNode(true));
      featureElement.append(anchorElement);
    } else {
      const spanElement = document.createElement('span');
      spanElement.setAttribute('slot', 'badge');
      spanElement.setAttribute('role', 'note');
      spanElement.textContent = 'New';
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

configTab.addEventListener('click', ({ currentTarget }) => {
  if (currentTarget.classList.contains('outdated')) {
    currentTarget.classList.remove('outdated');
    renderFeatures();
  }
});
