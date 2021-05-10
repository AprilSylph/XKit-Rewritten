/**
 * @param {string} scriptName - filename (without file extension) of script
 * @returns {object} - the script's preference values
 */
export const getPreferences = async function (scriptName) {
  const scriptManifestURL = browser.runtime.getURL(`/scripts/${scriptName}.json`);
  const scriptManifestFile = await fetch(scriptManifestURL);
  const scriptManifest = await scriptManifestFile.json();

  const { preferences = {} } = scriptManifest;
  const unsetPreferences = {};
  const preferenceValues = {};

  for (const [key, preference] of Object.entries(preferences)) {
    const storageKey = `${scriptName}.preferences.${key}`;
    const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);

    if (savedPreference === undefined) {
      Object.assign(unsetPreferences, { [storageKey]: preference.default });
      preferenceValues[key] = preference.default;
    } else {
      preferenceValues[key] = savedPreference;
    }
  }

  if (Object.keys(unsetPreferences).length !== 0) {
    browser.storage.local.set(unsetPreferences);
  }

  return preferenceValues;
};
