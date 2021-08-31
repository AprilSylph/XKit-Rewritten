import { getLanguageData } from './tumblr_helpers.js';

/**
 * @param {string} rootString - The English string to translate
 * @returns {Promise<string>} - The translated string in the current Tumblr locale
 */
export const translate = async function (rootString) {
  const languageData = await getLanguageData;
  return languageData.translations[rootString] || rootString;
};
