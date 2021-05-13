import { getPreferences } from '../util/preferences.js';

let enabledOptions;

const runOption = async function (name) {
  const { main: run } = await import(`./no_recommended/${name}.js`);
  run().catch(console.error);
};

const destroyOption = async function (name) {
  const { clean: destroy } = await import(`./no_recommended/${name}.js`);
  destroy().catch(console.error);
};

export const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') {
    return;
  }

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

export const main = async function () {
  const preferences = await getPreferences('no_recommended');

  enabledOptions = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledOptions.forEach(runOption);
};

export const clean = async function () {
  enabledOptions.forEach(destroyOption);
};
