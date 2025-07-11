/**
 * @param {string} featureName - Internal name of feature
 * @returns {Promise<object>} The feature's preference values
 */
export const getPreferences = async function (featureName) {
  const featureMetadataURL = browser.runtime.getURL(`/features/${featureName}/feature.json`);
  const featureMetadataFile = await fetch(featureMetadataURL);
  const { preferences = {} } = await featureMetadataFile.json();
  const storage = await browser.storage.local.get();

  const unsetPreferences = {};
  const preferenceValues = {};

  for (const [key, preference] of Object.entries(preferences)) {
    if (preference.type === 'iframe') { continue; }

    const storageKey = `${featureName}.preferences.${key}`;
    const savedPreference = storage[storageKey];

    if (savedPreference === undefined) {
      if (preference.inherit) {
        const inheritedDefault = storage[preference.inherit];
        if (inheritedDefault !== undefined) {
          preference.default = inheritedDefault;
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
