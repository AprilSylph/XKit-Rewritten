import { inject } from './inject.js';

const getLanguageData = () => window.tumblr.languageData;

export const languageData = await inject(getLanguageData);

/**
 * @param {string} rootString - The English string to translate
 * @returns {string} - The translated string in the current Tumblr locale
 */
export const translate = rootString => languageData.translations[rootString] || rootString;
