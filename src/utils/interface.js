import { keyToCss } from './css_map.js';
import { dom } from './dom.js';
import { inject } from './inject.js';
import { timelineSelector } from './timeline_id.js';

export const postSelector = '[tabindex="-1"][data-id]';
export const trailItemSelector = `${postSelector} ${keyToCss('reblog')}`;
export const blogViewSelector = '[style*="--blog-title-color"] *';
export const notificationSelector = `:is(${keyToCss('notification')}[role="listitem"], ${keyToCss('activityItem')})`;

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const cellSelector = keyToCss('cell');
const targetWrapperSelector = keyToCss(
  'targetWrapper',
  'targetWrapperBlock',
  'targetWrapperFlex',
  'targetWrapperInline',
);

/**
 * @param {Element} element Element within a timeline item
 * @returns {Element | null} The timeline item wrapper
 */
export const getTimelineItemWrapper = element =>
  (element.closest('[data-timeline-id]') && element.closest(listTimelineObjectSelector)?.parentElement) ||
  element.closest(cellSelector) ||
  element.closest(listTimelineObjectSelector);

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

/** @typedef {(timeline: HTMLElement) => boolean} TimelineFilter */

/**
 * @typedef PostFilterOptions
 * @property {string} [excludeClass] Classname to exclude and add
 * @property {TimelineFilter | TimelineFilter[]} [timeline] Filter results to matching timeline element children
 * @property {boolean} [noBlogView] Whether to exclude posts in the blog view modal
 * @property {boolean} [includeFiltered] Whether to include filtered posts
 */

/**
 * @param {Element[]} postElements Post elements (or descendants) to filter
 * @param {PostFilterOptions} [postFilterOptions] Post filter options
 * @returns {HTMLDivElement[]} Matching post elements
 */
export const filterPostElements = function (postElements, { excludeClass, timeline, noBlogView = false, includeFiltered = false } = {}) {
  postElements = postElements
    .filter(element => element.isConnected)
    .map(element => element.closest(postSelector))
    .filter(Boolean);

  if (timeline) {
    const timelineFilters = [timeline].flat().filter(Boolean);
    postElements = postElements.filter(postElement => {
      const timelineElement = postElement.closest(timelineSelector);
      return (
        timelineElement &&
        timelineFilters.some(timelineFilter => timelineFilter(timelineElement))
      );
    });
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
 * @param {PostFilterOptions} postFilterOptions Post filter options
 * @returns {HTMLDivElement[]} Matching post elements on the page
 */
export const getPostElements = postFilterOptions => filterPostElements([...document.querySelectorAll(postSelector)], postFilterOptions);

/**
 * @param {string} [css] CSS rules to be included
 * @returns {HTMLStyleElement} Style element containing the provided CSS
 */
export const buildStyle = (css = '') => dom('style', { class: 'xkit' }, null, [css]);

/**
 * Elements with these attributes will be immediately hidden when XKit Rewritten
 * is disabled in Firefox. Be sure that CSS that sets display: none on them for
 * other reasons has higher than 0-1-0 specificity.
 */
export const displayBlockUnlessDisabledAttr = 'data-xkit-display-block';
export const displayInlineBlockUnlessDisabledAttr = 'data-xkit-display-inline-block';
export const displayFlexUnlessDisabledAttr = 'data-xkit-display-flex';
export const displayInlineFlexUnlessDisabledAttr = 'data-xkit-display-inline-flex';

/**
 * This variable is set to "unset" in the src/content_scripts/interface.css
 * static stylesheet. A CSS variable set to any global keyword is treated in
 * var() expressions as if it were undefined.
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/var
 *
 * Don't reference this to try to create on-disable behavior in rules in other
 * src/content_scripts/*.css files: the rules themselves will be invalidated!
 */
export const noneIfXkitDisabledVar = '--none-if-xkit-disabled';

document.documentElement.append(
  buildStyle(`
    /**
     * This "none" fallback value will apply if Firefox invalidates the static
     * stylesheet but leaves this style element in the DOM.
     */
    :where(:root) {
      --none-if-xkit-disabled: none;
    }
    [${displayBlockUnlessDisabledAttr}] {
      display: var(--none-if-xkit-disabled, block);
    }
    [${displayInlineBlockUnlessDisabledAttr}] {
      display: var(--none-if-xkit-disabled, inline-block);
    }
    [${displayFlexUnlessDisabledAttr}] {
      display: var(--none-if-xkit-disabled, flex);
    }
    [${displayInlineFlexUnlessDisabledAttr}] {
      display: var(--none-if-xkit-disabled, inline-flex);
    }
  `),
);

/**
 * Determine a post's legacy type
 * @param {object} post Destructured into content and layout
 * @param {Array} [post.trail] Full post trail
 * @param {Array} [post.content] Post content array
 * @param {Array} [post.layout] Post layout array
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

const getClosestWithOverflow = element => {
  const parent = element.parentElement;
  if (!parent) {
    return element;
  } else if (getComputedStyle(parent).overflowX !== 'visible') {
    return parent;
  } else {
    return getClosestWithOverflow(parent);
  }
};

const isVerticallyOverflowing = element => {
  const elementRect = element.getBoundingClientRect();
  return elementRect.bottom > document.documentElement.clientHeight || elementRect.top < 0;
};

export const appendWithoutOverflow = (element, target, defaultPosition = 'below') => {
  element.dataset.position = defaultPosition;
  element.style.removeProperty('--horizontal-offset');

  target.appendChild(element);

  if (isVerticallyOverflowing(element)) {
    element.dataset.position = defaultPosition === 'below' ? 'above' : 'below';
  }
  if (isVerticallyOverflowing(element)) {
    element.dataset.position = defaultPosition;
  }

  const preventOverflowTarget = getClosestWithOverflow(target);
  const preventOverflowTargetRect = preventOverflowTarget.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  if (elementRect.right > preventOverflowTargetRect.right - 15) {
    element.style.setProperty('--horizontal-offset', `${preventOverflowTargetRect.right - 15 - elementRect.right}px`);
  } else if (elementRect.left < preventOverflowTargetRect.left + 15) {
    element.style.setProperty('--horizontal-offset', `${preventOverflowTargetRect.left + 15 - elementRect.left}px`);
  }
};

export const getClosestRenderedElement = (element, selector) =>
  inject('/main_world/closest_rendered_element.js', [selector], element);
