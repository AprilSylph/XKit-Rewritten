/**
 * @param {string} scriptName - Filename (without file extension) of script
 * @returns {Promise<object>} The script's preference values
 */
export const getPreferences = async function (scriptName) {
  const scriptManifestURL = browser.runtime.getURL(`/scripts/${scriptName}.json`);
  const scriptManifestFile = await fetch(scriptManifestURL);
  const scriptManifest = await scriptManifestFile.json();

  const { preferences = {} } = scriptManifest;
  const unsetPreferences = {};
  const preferenceValues = {};

  for (const [key, preference] of Object.entries(preferences)) {
    if (preference.type === 'iframe') { continue; }

    const storageKey = `${scriptName}.preferences.${key}`;
    const { [storageKey]: savedPreference } = await browser.storage.local.get(storageKey);

    if (savedPreference === undefined) {
      if (preference.inherit) {
        const { [preference.inherit]: inheritedDefault } = await browser.storage.local.get(preference.inherit);
        if (inheritedDefault !== undefined) {
          preference.default = inheritedDefault;
          browser.storage.local.remove(preference.inherit);
        }
      }

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
