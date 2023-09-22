import { keyToCss } from './css_map.js';
import { dom } from './dom.js';

export const postSelector = '[tabindex="-1"][data-id]';
export const blogViewSelector = '[style*="--blog-title-color"] *';

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const cellSelector = keyToCss('cell');
const targetWrapperSelector = keyToCss(
  'targetWrapper',
  'targetWrapperBlock',
  'targetWrapperFlex',
  'targetWrapperInline'
);

/**
 * @param {Element} element Element within a timeline item
 * @returns {Element | null} The timeline item wrapper
 */
export const getTimelineItemWrapper = element =>
  element.closest(cellSelector) || element.closest(listTimelineObjectSelector);

/**
 * @param {Element} element Element within a popover wrapper
 * @returns {Element | null} The outermost popover wrapper
 */
export const getPopoverWrapper = element => {
  const closestWrapper = element.closest(targetWrapperSelector);
  return closestWrapper?.parentElement?.matches(targetWrapperSelector)
    ? closestWrapper.parentElement
    : closestWrapper;
};

/**
 * @typedef {object} PostFilterOptions
 * @property {string} [excludeClass] - Classname to exclude and add
 * @property {RegExp|string} [timeline] - Filter results to matching [data-timeline] children
 * @property {boolean} [noBlogView] - Whether to exclude posts in the blog view modal
 * @property {boolean} [includeFiltered] - Whether to include filtered posts
 */

/**
 * @param {Element[]} postElements - Post elements (or descendants) to filter
 * @param {PostFilterOptions} [postFilterOptions] - Post filter options
 * @returns {HTMLDivElement[]} Matching post elements
 */
export const filterPostElements = function (postElements, { excludeClass, timeline, noBlogView = false, includeFiltered = false } = {}) {
  postElements = postElements
    .filter(element => element.isConnected)
    .map(element => element.closest(postSelector))
    .filter(Boolean);

  if (timeline instanceof RegExp) {
    postElements = postElements.filter(postElement => timeline.test(postElement.closest('[data-timeline]')?.dataset.timeline));
  } else if (timeline) {
    postElements = postElements.filter(postElement => timeline === postElement.closest('[data-timeline]')?.dataset.timeline);
  }

  if (noBlogView) {
    postElements = postElements.filter(postElement => postElement.matches(blogViewSelector) === false);
  }

  if (!includeFiltered) {
    postElements = postElements.filter(postElement => postElement.querySelector('article footer') !== null);
  }

  if (excludeClass) {
    postElements = postElements.filter(({ classList }) => classList.contains(excludeClass) === false);
    postElements.forEach(postElement => postElement.classList.add(excludeClass));
  }

  return postElements;
};

/**
 * @param {PostFilterOptions} postFilterOptions - Post filter options
 * @returns {HTMLDivElement[]} Matching post elements on the page
 */
export const getPostElements = postFilterOptions => filterPostElements([...document.querySelectorAll(postSelector)], postFilterOptions);

/**
 * @param {string} [css] - CSS rules to be included
 * @returns {HTMLStyleElement} Style element containing the provided CSS
 */
export const buildStyle = (css = '') => dom('style', { class: 'xkit' }, null, [css]);

/**
 * Determine a post's legacy type
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
