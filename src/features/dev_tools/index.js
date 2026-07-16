import { getPreferences } from '../../utils/preferences.js';

let enabledTools;

const runTool = async function (name) {
  const { main: run, styleElement } = await import(`./${name}.js`);
  if (run) {
    run().catch(console.error);
  }
  if (styleElement) {
    styleElement.dataset.xkitFeature = `tweaks_${name}`;
    document.documentElement.append(styleElement);
  }
};

const destroyTool = async function (name) {
  const { clean: destroy, styleElement } = await import(`./${name}.js`);
  if (destroy) {
    destroy().catch(console.error);
  }
  if (styleElement) {
    styleElement.remove();
  }
};

export const onStorageChanged = async function (changes, areaName) {
  if (Object.keys(changes).some(key => key.startsWith('dev_tools') && changes[key].oldValue !== undefined)) {
    const preferences = await getPreferences('dev_tools');

    const newEnabledTools = Object.keys(preferences).filter(key => preferences[key] === true);

    const newlyEnabled = newEnabledTools.filter(x => enabledTools.includes(x) === false);
    const newlyDisabled = enabledTools.filter(x => newEnabledTools.includes(x) === false);

    enabledTools = newEnabledTools;

    newlyEnabled.forEach(runTool);
    newlyDisabled.forEach(destroyTool);
  }
};

export const main = async function () {
  const preferences = await getPreferences('dev_tools');

  enabledTools = Object.keys(preferences).filter(key => preferences[key] === true);
  enabledTools.forEach(runTool);
};

export const clean = async function () {
  enabledTools.forEach(destroyTool);
};
