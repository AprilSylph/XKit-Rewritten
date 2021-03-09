(function () {
  /**
   * @param {string} scriptName - filename (without file extension) of script
   * @returns {object} - the script's preference values
   */
  const getPreferences = async function (scriptName) {
    const scriptManifestURL = browser.runtime.getURL(`/scripts/${scriptName}.json`);
    const scriptManifestFile = await fetch(scriptManifestURL);
    const scriptManifest = await scriptManifestFile.json();

    const { preferences = {} } = scriptManifest;
    const preferenceValues = {};

    for (const [key, preference] of Object.entries(preferences)) {
      const storageKey = `${scriptName}.preferences.${key}`;
      const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);

      if (savedPreference === undefined) {
        browser.storage.local.set({ [storageKey]: preference.default });
        preferenceValues[key] = preference.default;
      } else {
        preferenceValues[key] = savedPreference;
      }
    }

    return preferenceValues;
  };

  return { getPreferences };
})();
