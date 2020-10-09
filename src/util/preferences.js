(function () {
  /**
   * @param {string} scriptName - filename (without file extension) of script
   * @returns {object} - the script's preference values
   */
  const getPreferences = async function (scriptName) {
    const scriptManifestURL = browser.runtime.getURL(`/src/scripts/${scriptName}.json`);
    const scriptManifestFile = await fetch(scriptManifestURL);
    const scriptManifest = await scriptManifestFile.json();

    const { preferences = {} } = scriptManifest;
    const preferenceValues = {};

    for (const [key, preference] of Object.entries(preferences)) {
      const storageKey = `${scriptName}.preferences.${key}`;
      const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);

      preferenceValues[key] = savedPreference === undefined ? preference.default : savedPreference;
    }

    return preferenceValues;
  };

  return { getPreferences };
})();
