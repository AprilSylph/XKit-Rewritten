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

const snakeToCamel = word => word.replace(/_(.)/g, (match, g1) => g1.toUpperCase());

/**
 * @see https://github.com/tumblr/docs/blob/master/api.md#postspost-id---editing-a-post-neue-post-format
 * @see https://github.com/tumblr/docs/blob/master/api.md#posts---createreblog-a-post-neue-post-format
 */
const editRequestParams = [
  'content',
  'layout',
  'state',
  'publish_on',
  'date',
  'tags',
  'source_url',
  'send_to_twitter',
  'slug',
  'interactability_reblog',

  // not currently documented
  'can_be_tipped',
  'has_community_label',
  'community_label_categories'
].map(snakeToCamel);

/**
 * Create an NPF edit request body.
 *
 * @param {object} postData - camelCased /posts/{post-id} GET request response JSON
 * @returns {object} editRequestBody - camelCased /posts/{post-id} PUT request body parameters
 */
export const createEditRequestBody = postData => {
  const { tags, sourceUrlRaw, ...rest } = postData;

  const entries = Object.entries({
    ...rest,
    tags: tags.join(','),
    sourceUrl: sourceUrlRaw
  });

  return Object.fromEntries(entries.filter(([key, value]) => editRequestParams.includes(key)));
};
