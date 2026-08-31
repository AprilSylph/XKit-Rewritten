import { button, div } from './dom.js';
import { buildStyle, getTimelineItemWrapper } from './interface.js';
import { anyPostPermalinkTimelineFilter, timelineSelector } from './timeline_id.js';

const controlsClass = 'xkit-hidden-post-controls';

// Remove outdated elements when loading module
$(`.${controlsClass}`).remove();

const styleElement = buildStyle(`
.${controlsClass} {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-m);
  border-radius: 8px;
  margin-bottom: var(--space-m);

  background-color: var(--content-panel);
  background-image: linear-gradient(var(--content-tint), var(--content-tint));
  color: var(--content-fg-secondary);

  font-family: var(--font-family-modern);
  font-size: 1rem;
  font-weight: 350;
  line-height: 1.5rem;
}

.${controlsClass} + .${controlsClass} {
  display: none;
}

.${controlsClass} button {
  flex-shrink: 0;
  padding: 10px 16px;
  border-radius: 9999px;

  font-family: var(--font-family-modern);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
}

.${controlsClass} button:hover {
  background-color: var(--content-tint);
  color: var(--content-fg);
}

.${controlsClass} button:active {
  background-color: var(--content-tint-strong);
}

.${controlsClass} button:focus-visible {
  outline: 2px solid var(--content-ui-focus);
  outline-offset: 2px;
}

/* Palettes for Tumblr font override compatibility */
:root[style*="--font-family-modern"] .${controlsClass} {
  font-weight: normal;
}
:root[style*="--font-family-modern"] .${controlsClass} button {
  font-weight: bold;
}
`);
document.documentElement.append(styleElement);

/**
 * @typedef {object} PostHideFunctions
 * @property {(postElement: Element) => void} hidePost Hides a post.
 * @property {(postElement: Element) => void} showPost Shows a post that was previously hidden.
 * @property {() => void} showPosts Shows all posts hidden by this post hiding instance.
 */

/**
 * @typedef {object} PermalinkPageOptions
 * @property {string} message Message to display in permalink page controls (e.g. "This post contains a blocked blog!")
 */

/**
 * Create functions to hide a post element, handling lifecycle and edge case concerns.
 * @param {object} options Destructured
 * @param {string} options.id Identifier for this post hiding instance (must be unique)
 * @param {PermalinkPageOptions} [options.permalinkPageControls] If specified, single posts on permalink pages are hidden with an informative, dismissable UI
 * @returns {PostHideFunctions} Functions to hide/show posts
 */
export const createPostHideFunctions = ({ id, permalinkPageControls }) => {
  const hiddenAttribute = `data-xkit-${id}-hidden`;

  const controlledHiddenAttribute = `data-xkit-${id}-hidden-controlled`;
  const controlsAttribute = `data-xkit-${id}-hidden-controls`;

  /**
   * CSS content replacement removes the target timeline item element from the DOM (including excluding it from control/command-F page search) without entirely removing the timeline item bounding box, which would break Tumblr's J/K scroll shortcuts.
   */
  styleElement.textContent += `
    [${hiddenAttribute}], [${controlsAttribute}] ~ div [${controlledHiddenAttribute}] {
      content: linear-gradient(transparent, transparent);
      height: 0;
      margin: 0 !important;
    }
  `;

  const addPermalinkPageControls = (postElement, timelineElement) => {
    const timelineItemWrapper = getTimelineItemWrapper(postElement);
    if (timelineItemWrapper.hasAttribute(controlledHiddenAttribute) === false) {
      timelineItemWrapper.toggleAttribute(controlledHiddenAttribute, true);

      const { message } = permalinkPageControls;
      const controlsElement = div({ class: controlsClass, [controlsAttribute]: '' }, [
        message,
        button({ click: () => controlsElement.remove() }, ['View post']),
      ]);
      timelineElement.prepend(controlsElement);
    }
  };

  const hidePost = postElement => {
    const timelineElement = postElement.closest(timelineSelector);
    const onPermalinkPage = anyPostPermalinkTimelineFilter(timelineElement);

    if (onPermalinkPage) {
      if (permalinkPageControls) {
        addPermalinkPageControls(postElement, timelineElement);
      } else {
        // do nothing; avoid hiding single post and making permalink page look broken
      }
    } else {
      getTimelineItemWrapper(postElement).toggleAttribute(hiddenAttribute, true);
    }
  };
  const showPost = postElement => {
    getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    getTimelineItemWrapper(postElement).removeAttribute(controlledHiddenAttribute);
    postElement.closest(timelineSelector)?.querySelector(`[${controlsAttribute}]`)?.remove();
  };
  const showPosts = () => {
    $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
    $(`[${controlledHiddenAttribute}]`).removeAttr(controlledHiddenAttribute);
    $(`[${controlsAttribute}]`).remove();
  };
  showPosts();

  return { hidePost, showPost, showPosts };
};
