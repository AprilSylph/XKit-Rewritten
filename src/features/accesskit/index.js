import { getPreferences } from '../../utils/preferences.js';

let enabledOptions;

const getOption = name => import(browser.runtime.getURL(`/features/accesskit/${name}.js`));

const runOption = async function (name) {
  const { main: run, styleElement } = await getOption(name);
  if (run) {
    run().catch(console.error);
  }
  if (styleElement) {
    styleElement.dataset.xkitFeature = `accesskit_${name}`;
    document.documentElement.append(styleElement);
  }
};

const destroyOption = async function (name) {
  const { clean: destroy, styleElement } = await getOption(name);
  if (destroy) {
    destroy().catch(console.error);
  }
  if (styleElement) {
    styleElement.remove();
  }
};

export const onStorageChanged = async function (changes) {
  if (Object.keys(changes).some(key => key.startsWith('accesskit') && changes[key].oldValue !== undefined)) {
    const preferences = await getPreferences('accesskit');

    const newEnabledOptions = Object.keys(preferences).filter(key => preferences[key] === true);

    const newlyEnabled = newEnabledOptions.filter(x => enabledOptions.includes(x) === false);
    const newlyDisabled = enabledOptions.filter(x => newEnabledOptions.includes(x) === false);

    enabledOptions = newEnabledOptions;

    newlyEnabled.forEach(runOption);
    newlyDisabled.forEach(destroyOption);
  }
};

export const main = async function () {
  const preferences = await getPreferences('accesskit');

  enabledOptions = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledOptions.forEach(runOption);
};

export const clean = async function () {
  enabledOptions.forEach(destroyOption);
};

export const stylesheet = true;
