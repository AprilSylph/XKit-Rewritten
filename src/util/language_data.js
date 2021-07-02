import { getLanguageData } from './tumblr_helpers.js';

let languageData;

/**
 * @param {string} rootString - The English string to translate
 * @returns {Promise<string>} - The translated string in the current Tumblr locale
 */
export const translate = async function (rootString) {
  if (!languageData) {
    languageData = await getLanguageData();
  }

  return languageData.translations[rootString] || rootString;
};
