import { getPreferences } from '../util/preferences.js';

let enabledTweaks;

const runTweak = async function (name) {
  const { main: run } = await import(`./tweaks/${name}.js`);
  run().catch(console.error);
};

const destroyTweak = async function (name) {
  const { clean: destroy } = await import(`./tweaks/${name}.js`);
  destroy().catch(console.error);
};

const onStorageChanged = async function (changes, areaName) {
  if (areaName !== 'local') {
    return;
  }

  if (Object.keys(changes).some(key => key.startsWith('tweaks') && changes[key].oldValue !== undefined)) {
    const preferences = await getPreferences('tweaks');

    const newEnabledTweaks = Object.keys(preferences).filter(key => preferences[key] === true);

    const newlyEnabled = newEnabledTweaks.filter(x => enabledTweaks.includes(x) === false);
    const newlyDisabled = enabledTweaks.filter(x => newEnabledTweaks.includes(x) === false);

    enabledTweaks = newEnabledTweaks;

    newlyEnabled.forEach(runTweak);
    newlyDisabled.forEach(destroyTweak);
  }
};

export const main = async function () {
  browser.storage.onChanged.addListener(onStorageChanged);

  const preferences = await getPreferences('tweaks');

  enabledTweaks = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledTweaks.forEach(runTweak);
};

export const clean = async function () {
  enabledTweaks.forEach(destroyTweak);
};
