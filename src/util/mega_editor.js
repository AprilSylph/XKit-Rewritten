import { inject } from './inject.js';

const formKeyPromise = fetch('https://www.tumblr.com/neue_web/iframe/new/text').then(response => {
  if (response.ok) {
    return response.text();
  } else {
    throw Object.assign(new Error(response.status), { response });
  }
}).then(responseText => {
  const responseDocument = (new DOMParser()).parseFromString(responseText, 'text/html');
  return responseDocument.getElementById('tumblr_form_key').getAttribute('content');
}).catch(console.error);

const pathnames = {
  add: 'add_tags_to_posts',
  remove: 'remove_tags_from_posts',
  delete: 'delete_posts',
  private: 'privatize_posts'
};

/**
 * @param {string[]} postIds - Array of post IDs to edit (must not exceed 100 items)
 * @param {object} options - Configuration object
 * @param {string} options.mode - Post editing method; valid modes are:
 *                                 1. "add" (add tags to posts)
 *                                 2. "remove" (remove tags from posts)
 *                                 3. "delete" (delete posts)
 *                                 4. "private" (make posts private)
 * @param {string[]} [options.tags] - Array of tags to add or remove. Required if options.mode is "add" or "remove"
 * @returns {Promise<Response>} Response from constructed request
 */
export const megaEdit = async function (postIds, options) {
  const pathname = pathnames[options.mode];

  const formKey = await formKeyPromise;

  const requestBody = {
    post_ids: postIds.join(','),
    form_key: formKey,
    tags: options.tags ? options.tags.join(',') : ''
  };

  if (['delete', 'private'].includes(options.mode)) {
    delete requestBody.tags;
  }

  return inject(
    async (resource, body) =>
      fetch(resource, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body
      }).then(async response =>
        response.ok ? response.json() : Promise.reject(await response.json())
      ),
    [`https://www.tumblr.com/${pathname}`, $.param(requestBody)]
  );
};

/**
 * @param {string} blogName - The name of the blog to edit posts on
 * @param {string[]} postIds - Array of post IDs to edit (must not exceed 100 items)
 * @param {object} options - Configuration object
 * @param {boolean} options.hasCommunityLabel - Whether the posts should have a community label
 * @param {string[]} options.categories - valid modes are:
 *                                 1. "drug_use"
 *                                 2. "violence"
 *                                 3. "sexual_themes"
 * @returns {Promise<Response>} Response from constructed request
 */
export const bulkCommunityLabel = async function (blogName, postIds, options) {
  const formKey = await formKeyPromise;

  const requestBody = {
    form_key: formKey,
    has_community_label: options.hasCommunityLabel,
    categories: options.categories,
    post_keys: postIds.map(id => ({ id }))
  };

  return inject(
    async (resource, body) =>
      fetch(resource, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body
      }).then(async response =>
        response.ok ? response.json() : Promise.reject(await response.json())
      ),
    [`https://www.tumblr.com/svc/blog/${blogName}/bulk_community_label_posts`, $.param(requestBody)]
  );
};
