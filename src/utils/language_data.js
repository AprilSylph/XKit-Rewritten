import { inject } from './inject.js';

/**
 * @see https://github.com/tumblr/docs/blob/master/web-platform.md#languagedata
 * @typedef {object} TumblrLanguageData
 * @property {string} code Current Tumblr locale code
 * @property {Record<string, string>} translations Per docs, "a map of English root strings to the equivalents in the current language"
 */

/** @type {TumblrLanguageData}  */
export const languageData = await inject('/main_world/language_data.js');

/**
 * @param {string} rootString The English string to translate
 * @returns {string} The translated string in the current Tumblr locale
 */
export const translate = rootString => languageData.translations[rootString] || rootString;
