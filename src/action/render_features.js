import { XKitFeature } from './components/xkit-feature/index.js';

const configSection = document.getElementById('configuration');
const configSectionLink = document.querySelector('a[href="#configuration"]');
const featuresDiv = configSection.querySelector('.features');

const enabledFeaturesKey = 'enabledScripts';
const specialAccessKey = 'specialAccess';

const getInstalledFeatures = async () => {
  const url = browser.runtime.getURL('/features/index.json');
  const file = await fetch(url);
  const installedFeatures = await file.json();

  return installedFeatures;
};

const renderFeatures = async () => {
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
    const { title, description, icon, ...metadata } = await file.json();

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
