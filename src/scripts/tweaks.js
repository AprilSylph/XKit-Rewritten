(function() {
  let enabledTweaks;

  const run_tweak = async function(name) {
    const { run } = await fakeImport(`/src/scripts/tweaks/${name}.js`);
    run().catch(console.error);
  };

  const destroy_tweak = async function(name) {
    const { destroy } = await fakeImport(`/src/scripts/tweaks/${name}.js`);
    destroy().catch(console.error);
  };

  const onStorageChanged = async function(changes, areaName) {
    const {'tweaks.preferences': preferences} = changes;
    if (!preferences || areaName !== 'local') {
      return;
    }

    const {oldValue = {}, newValue = {}} = preferences;
    const oldTweaks = Object.keys(oldValue).filter(key => oldValue[key] === true);
    const newTweaks = Object.keys(newValue).filter(key => newValue[key] === true);

    enabledTweaks = newTweaks;

    const newlyEnabled = newTweaks.filter(x => oldTweaks.includes(x) === false);
    const newlyDisabled = oldTweaks.filter(x => newTweaks.includes(x) === false);

    newlyEnabled.forEach(run_tweak);
    newlyDisabled.forEach(destroy_tweak);
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const {'tweaks.preferences': preferences = {}} = await browser.storage.local.get('tweaks.preferences');
    enabledTweaks = Object.keys(preferences).filter(key => preferences[key] === true);
    enabledTweaks.forEach(run_tweak);
  };

  const clean = async function() {
    enabledTweaks.forEach(destroy_tweak);
  };

  return { main, clean };
})();
