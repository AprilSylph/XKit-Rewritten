import { inject } from './inject.js';

/**
 * @param {...any} args - Arguments to pass to window.tumblr.apiFetch()
 * @see {@link https://github.com/tumblr/docs/blob/master/web-platform.md#apifetch}
 * @returns {Promise<Response|Error>} Resolves or rejects with result of window.tumblr.apiFetch()
 */
export const apiFetch = async function (...args) {
  return inject(
    async (resource, init = {}) => {
      // add XKit header to all API requests
      init.headers ??= {};
      init.headers['X-XKit'] = '1';

      // convert all keys in the body to snake_case
      if (init.body !== undefined) {
        const objects = [init.body];

        while (objects.length !== 0) {
          const currentObjects = objects.splice(0);

          currentObjects.forEach(obj => {
            Object.keys(obj).forEach(key => {
              const snakeCaseKey = key
                .replace(/^[A-Z]/, match => match.toLowerCase())
                .replace(/[A-Z]/g, match => `_${match.toLowerCase()}`);

              if (snakeCaseKey !== key) {
                obj[snakeCaseKey] = obj[key];
                delete obj[key];
              }
            });
          });

          objects.push(
            ...currentObjects
              .flatMap(Object.values)
              .filter(value => value instanceof Object)
          );
        }
      }

      return window.tumblr.apiFetch(resource, init);
    },
    args
  );
};

export const navigate = location =>
  inject(location => window.tumblr.navigate(location), [location]);

export const onClickNavigate = event => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

  const href = event.currentTarget.getAttribute('href');
  if (href) {
    event.preventDefault();
    navigate(href);
  }
};
