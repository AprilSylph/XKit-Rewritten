import { getPreferences } from '../utils/preferences.js';

let enabledOptions;

const runOption = async name => {
  const { main: run, styleElement } = await import(`./no_recommended/${name}.js`);
  if (run) {
    run().catch(console.error);
  }
  if (styleElement) {
    styleElement.dataset.xkitFeature = `no_recommended_${name}`;
    document.documentElement.append(styleElement);
  }
};

const destroyOption = async name => {
  const { clean: destroy, styleElement } = await import(`./no_recommended/${name}.js`);
  if (destroy) {
    destroy().catch(console.error);
  }
  if (styleElement) {
    styleElement.remove();
  }
};

export const onStorageChanged = async (changes, areaName) => {
  if (Object.keys(changes).some(key => key.startsWith('no_recommended') && changes[key].oldValue !== undefined)) {
    const preferences = await getPreferences('no_recommended');

    const newEnabledOptions = Object.keys(preferences).filter(key => preferences[key] === true);

    const newlyEnabled = newEnabledOptions.filter(x => enabledOptions.includes(x) === false);
    const newlyDisabled = enabledOptions.filter(x => newEnabledOptions.includes(x) === false);

    enabledOptions = newEnabledOptions;

    newlyEnabled.forEach(runOption);
    newlyDisabled.forEach(destroyOption);
  }
};

export const main = async () => {
  const preferences = await getPreferences('no_recommended');

  enabledOptions = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledOptions.forEach(runOption);
};

export const clean = async () => {
  enabledOptions.forEach(destroyOption);
};
