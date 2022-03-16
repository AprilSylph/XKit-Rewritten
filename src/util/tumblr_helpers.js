import { inject } from './inject.js';

/**
 * @param {...any} args - Arguments to pass to window.tumblr.apiFetch()
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response|Error>} Resolves or rejects with result of window.tumblr.apiFetch()
 */
export const apiFetch = async function (...args) {
  return inject(
    async (resource, init) => {
      // make sure init is an object we can modify
      if (typeof init !== 'object' || init === null) {
        init = {};
      }

      // make sure init.headers is an object we can modify
      if (typeof init.headers !== 'object' || init.headers === null) {
        init.headers = {};
      }

      // make sure every API request we make is telling Tumblr that we're XKit
      init.headers['X-XKit'] = '1';
      return window.tumblr.apiFetch(resource, init);
    },
    args
  );
};

export const getCssMap = inject(async () => window.tumblr.getCssMap());
export const getLanguageData = inject(async () => window.tumblr.languageData);
