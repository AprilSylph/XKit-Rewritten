import { inject } from './inject.js';

const xkitApiFetch = async (resource, init) => window.tumblr.apiFetch(resource, init);
/**
 * @param {...any} args - Arguments to pass to window.tumblr.apiFetch()
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response|Error>} Resolves or rejects with result of window.tumblr.apiFetch()
 */
export const apiFetch = async function (...args) {
  return inject(xkitApiFetch, args);
};

const xkitGetCssMap = async () => window.tumblr.getCssMap();
export const getCssMap = inject(xkitGetCssMap);

const xkitGetLanguageData = async () => window.tumblr.languageData;
export const getLanguageData = inject(xkitGetLanguageData);
