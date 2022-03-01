import { inject } from './inject.js';

let formKey;

const pathnames = {
  add: 'add_tags_to_posts',
  remove: 'remove_tags_from_posts',
  delete: 'delete_posts'
};

/**
 * @param {string[]} postIds - Array of post IDs to edit (must not exceed 100 items)
 * @param {object} options - Configuration object
 * @param {string} options.mode - Post editing method; valid modes are:
 *                                 1. "add" (add tags to posts)
 *                                 2. "remove" (remove tags from posts)
 *                                 3. "delete" (delete posts)
 * @param {string[]} options.tags - Array of tags to add or remove. Required if options.mode is "add" or "remove"
 * @returns {Promise<Response>} Response from constructed request
 */
export const megaEdit = async function (postIds, options) {
  const pathname = pathnames[options.mode];

  if (!formKey) {
    formKey = await fetch('https://www.tumblr.com/about').then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw Object.assign(new Error(response.status), { response });
      }
    }).then(responseText => {
      const responseDocument = (new DOMParser()).parseFromString(responseText, 'text/html');
      return responseDocument.getElementById('tumblr_form_key').getAttribute('content');
    }).catch(console.error);
  }

  const requestBody = {
    post_ids: postIds.join(','),
    form_key: formKey,
    tags: options.tags ? options.tags.join(',') : ''
  };

  if (options.mode === 'delete') {
    delete requestBody.tags;
  }

  return inject(async (resource, body) => fetch(resource, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body
  }), [`https://www.tumblr.com/${pathname}`, $.param(requestBody)]);
};
