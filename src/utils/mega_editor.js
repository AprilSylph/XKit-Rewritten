import { inject } from './inject.js';

let formKey;

const getFormKey = () => fetch('https://www.tumblr.com/neue_web/iframe/new/text').then(response => {
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
  private: 'privatize_posts',
};

/**
 * @param {string[]} postIds Array of post IDs to edit (must not exceed 100 items)
 * @param {object} options Configuration object
 * @param {string} options.mode Post editing method; valid modes are:
 *                                 1. "add" (add tags to posts)
 *                                 2. "remove" (remove tags from posts)
 *                                 3. "delete" (delete posts)
 *                                 4. "private" (make posts private)
 * @param {string[]} [options.tags] Array of tags to add or remove. Required if options.mode is "add" or "remove"
 * @returns {Promise<Response>} Response from constructed request
 */
export const megaEdit = async function (postIds, options) {
  const pathname = pathnames[options.mode];

  formKey ??= await getFormKey();

  const requestBody = {
    post_ids: postIds.join(','),
    form_key: formKey,
    tags: options.tags ? options.tags.join(',') : '',
  };

  if (['delete', 'private'].includes(options.mode)) {
    delete requestBody.tags;
  }

  return inject(
    '/main_world/post_request.js',
    [`https://www.tumblr.com/${pathname}`, $.param(requestBody)],
  );
};
