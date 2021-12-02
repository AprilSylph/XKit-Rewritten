/**
 * @param {object} options - Destructured
 * @param {string} options.excludeClass - Classname to exclude and add
 * @param {RegExp} [options.timeline] - Filter results to matching [data-timeline] children {@link ./react_props.js exposeTimelines}
 * @param {boolean} [options.noPeepr] - Whether to exclude posts in [role="dialog"]
 * @param {boolean} [options.includeFiltered] - Whether to include filtered posts
 * @returns {HTMLDivElement[]} Post elements matching the query options
 */
export const getPostElements = function ({ excludeClass, timeline, noPeepr = false, includeFiltered = false }) {
  if (!excludeClass) {
    return [];
  }

  const selector = `[tabindex="-1"][data-id]:not(.${excludeClass})`;
  let postElements = [...document.querySelectorAll(selector)];

  if (timeline instanceof RegExp) {
    postElements = postElements.filter(postElement => timeline.test(postElement.closest('[data-timeline]').dataset.timeline));
  }

  if (noPeepr) {
    postElements = postElements.filter(postElement => postElement.matches('[role="dialog"] [tabindex="-1"][data-id]') === false);
  }

  if (!includeFiltered) {
    postElements = postElements.filter(postElement => postElement.querySelector('article footer') !== null);
  }

  postElements.forEach(postElement => postElement.classList.add(excludeClass));

  return postElements;
};

/**
 * @param {string} [css] - CSS rules to be included
 * @returns {HTMLStyleElement} Style element containing the provided CSS
 */
export const buildStyle = (css = '') => Object.assign(document.createElement('style'), { className: 'xkit', textContent: css });

/**
 * Determine a post's legacy type
 *
 * @param {object} post - Destructured into content and layout
 * @param {Array} [post.trail] - Full post trail
 * @param {Array} [post.content] - Post content array
 * @param {Array} [post.layout] - Post layout array
 * @returns {string} The determined legacy type of the post
 * @see https://github.com/tumblr/docs/blob/master/npf-spec.md#mapping-npf-post-content-to-legacy-post-types
 */
export const postType = ({ trail = [], content = [], layout = [] }) => {
  content = trail[0]?.content || content;
  layout = trail[0]?.layout || layout;

  if (layout.some(({ type }) => type === 'ask')) return 'ask';
  else if (content.some(({ type }) => type === 'video')) return 'video';
  else if (content.some(({ type }) => type === 'image')) return 'photo';
  else if (content.some(({ type }) => type === 'audio')) return 'audio';
  else if (content.some(({ type, subtype }) => type === 'text' && subtype === 'quote')) return 'quote';
  else if (content.some(({ type, subtype }) => type === 'text' && subtype === 'chat')) return 'chat';
  else if (content.some(({ type }) => type === 'link')) return 'link';
  else return 'text';
};
