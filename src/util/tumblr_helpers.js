import { inject } from './inject.js';

/**
 * @param {...any} args - Arguments to pass to window.tumblr.apiFetch()
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response|Error>} Resolves or rejects with result of window.tumblr.apiFetch()
 */
export const apiFetch = async function (...args) {
  return inject(async function xkitApiFetch (resource, init) {
    return window.tumblr.apiFetch(resource, init);
  }, args);
};

export const getCssMap = inject(async () => window.tumblr.getCssMap());
export const getLanguageData = inject(async () => window.tumblr.languageData);
