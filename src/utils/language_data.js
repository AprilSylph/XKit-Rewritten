import { inject } from './inject.js';

export const languageData = await inject(() => window.tumblr.languageData);

/**
 * @param {string} rootString - The English string to translate
 * @returns {string} - The translated string in the current Tumblr locale
 */
export const translate = rootString => languageData.translations[rootString] || rootString;
