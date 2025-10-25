import { getPreferences } from '../../utils/preferences.js';

let enabledTweaks;

const runTweak = async name => {
  const { main: run, styleElement } = await import(`./${name}.js`);
  if (run) {
    run().catch(console.error);
  }
  if (styleElement) {
    styleElement.dataset.xkitFeature = `tweaks_${name}`;
    document.documentElement.append(styleElement);
  }
};

const destroyTweak = async name => {
  const { clean: destroy, styleElement } = await import(`./${name}.js`);
  if (destroy) {
    destroy().catch(console.error);
  }
  if (styleElement) {
    styleElement.remove();
  }
};

export const onStorageChanged = async changes => {
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

export const main = async () => {
  const preferences = await getPreferences('tweaks');

  enabledTweaks = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledTweaks.forEach(runTweak);
};

export const clean = async () => {
  enabledTweaks.forEach(destroyTweak);
};
