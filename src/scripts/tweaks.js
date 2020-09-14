(function () {
  let enabledTweaks;

  const runTweak = async function (name) {
    const { main: run } = await fakeImport(`/src/scripts/tweaks/${name}.js`);
    run().catch(console.error);
  };

  const destroyTweak = async function (name) {
    const { clean: destroy } = await fakeImport(`/src/scripts/tweaks/${name}.js`);
    destroy().catch(console.error);
  };

  const onStorageChanged = async function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    if (Object.keys(changes).some(key => key.startsWith('tweaks'))) {
      const { getPreferences } = await fakeImport('/src/util/preferences.js');
      const preferences = await getPreferences('tweaks');

      const newEnabledTweaks = Object.keys(preferences).filter(key => preferences[key] === true);

      const newlyEnabled = newEnabledTweaks.filter(x => enabledTweaks.includes(x) === false);
      const newlyDisabled = enabledTweaks.filter(x => newEnabledTweaks.includes(x) === false);

      enabledTweaks = newEnabledTweaks;

      newlyEnabled.forEach(runTweak);
      newlyDisabled.forEach(destroyTweak);
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');

    const preferences = await getPreferences('tweaks');

    enabledTweaks = Object.keys(preferences).filter(key => preferences[key] === true);
    enabledTweaks.forEach(runTweak);
  };

  const clean = async function () {
    enabledTweaks.forEach(destroyTweak);
  };

  return { main, clean };
})();
