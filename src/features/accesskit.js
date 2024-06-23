import { getPreferences } from '../utils/preferences.js';

let enabledOptions;

const runOption = async name => {
  const { main: run } = await import(`./accesskit/${name}.js`);
  run().catch(console.error);
};

const destroyOption = async name => {
  const { clean: destroy } = await import(`./accesskit/${name}.js`);
  destroy().catch(console.error);
};

export const onStorageChanged = async (changes, areaName) => {
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

export const main = async () => {
  const preferences = await getPreferences('accesskit');

  enabledOptions = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledOptions.forEach(runOption);
};

export const clean = async () => {
  enabledOptions.forEach(destroyOption);
};

export const stylesheet = true;
