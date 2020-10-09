browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || Object.keys(changes).includes('storageLastModified')) {
    return;
  }

  const now = new Date();
  const storageLastModified = now.getTime();

  browser.storage.local.set({ storageLastModified });
});

(async function () {
  const { getURL } = browser.runtime;

  const indexUrl = getURL('/src/scripts/_index.json');
  const indexFile = await fetch(indexUrl);
  const installedScripts = await indexFile.json();

  for (const scriptName of installedScripts) {
    const url = getURL(`/src/scripts/${scriptName}.json`);
    const file = await fetch(url);
    const { preferences = {} } = await file.json();

    for (const [key, preference] of Object.entries(preferences)) {
      const storageKey = `${scriptName}.preferences.${key}`;
      const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);

      if (savedPreference === undefined) {
        browser.storage.local.set({ [storageKey]: preference.default });
      }
    }
  }
})();
