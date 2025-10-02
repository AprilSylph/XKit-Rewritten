import { inject } from './inject.js';

export const languageData = await inject('/main_world/language_data.js');

/**
 * @param {string} rootString - The English string to translate
 * @returns {string} - The translated string in the current Tumblr locale
 */
export const translate = rootString => languageData.translations[rootString] || rootString;

const getAdvancedLanguageData = () => {
  const result = {};
  try {
    const { languageData: { data: { domain, locale_data: localeData } } } =
      JSON.parse(document.getElementById('___INITIAL_STATE___').textContent);

    localeData && Object.entries(localeData[domain ?? 'messages']).forEach(([keyWithContext, values]) => {
      [keyWithContext, keyWithContext.split('\u0004').at(-1)]
        .filter(Boolean)
        .forEach(key => {
          result[key] ??= [];
          values.forEach(value => result[key].includes(value) || result[key].push(value));
        });
    });
  } catch {}
  return result;
};

let advancedLanguageData;

/**
 * @param {string} rootString - The English string to translate
 * @returns {string[]} - Array of translated strings in the current Tumblr locale
 */
export const advancedTranslate = rootString => {
  advancedLanguageData ??= getAdvancedLanguageData();
  return advancedLanguageData[rootString] || [translate(rootString)];
};
