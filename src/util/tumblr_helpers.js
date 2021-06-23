import { inject } from './inject.js';

/**
 * @param {...any} args - Arguments to pass to window.tumblr.apiFetch()
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response|Error>} Resolves or rejects with result of window.tumblr.apiFetch()
 */
export const apiFetch = async function (...args) {
  return inject(
    async (resource, init) => window.tumblr.apiFetch(resource, init),
    args
  );
};

/**
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#getcssmap}
 * @returns {Promise<object>} The result of window.tumblr.getCssMap()
 */
export const getCssMap = async function () {
  return inject(async () => window.tumblr.getCssMap());
};

/**
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#languagedata}
 * @returns {Promise<object>} - The window.tumblr.languageData object
 */
export const getLanguageData = async function () {
  return inject(async () => window.tumblr.languageData);
};
