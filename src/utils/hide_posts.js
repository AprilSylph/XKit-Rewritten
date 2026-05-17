import { br, button, div } from './dom.js';
import { buildStyle, getTimelineItemWrapper } from './interface.js';
import { anyPostPermalinkTimelineFilter, timelineSelector } from './timeline_id.js';

const controlsClass = 'xkit-hidden-post-controls';

const styleElement = buildStyle(`
.${controlsClass} {
  padding: 25px 20px;
  border-radius: 3px;
  margin-bottom: var(--post-padding);

  background-color: var(--blog-title-color-15, rgba(var(--white-on-dark), 0.25));
  color: var(--blog-title-color, rgba(var(--white-on-dark)));

  font-weight: 700;
  text-align: center;
  line-height: 1.5em;
}

.${controlsClass} button {
  color: var(--blog-link-color, rgb(var(--deprecated-accent)));
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
 * @property {string} buttonText Text for the button that permalink page controls dismiss button (e.g. "show post anyway")
 */

/**
 * @param {object} options Destructured
 * @param {string} options.id Identifier for this post hiding instance (must be unique)
 * @param {PermalinkPageOptions} [options.permalinkPageControls] If specified, single posts on permalink pages are hidden with an informative, dismissable UI
 * @param {boolean} [options.hideManually] Disables CSS injection for manual control over hidden post styling
 * @returns {PostHideFunctions} Functions to hide/show posts
 */
export const createPostHideFunctions = ({ id, permalinkPageControls, hideManually = false }) => {
  const hiddenAttribute = `data-xkit-${id}-hidden`;

  const controlledHiddenAttribute = `data-xkit-${id}-hidden-controlled`;
  const controlsAttribute = `data-xkit-${id}-hidden-controls`;

  if (!hideManually) {
    styleElement.textContent += `
      [${hiddenAttribute}], [${controlsAttribute}] ~ div [${controlledHiddenAttribute}] {
        content: linear-gradient(transparent, transparent);
        height: 0;
      }
    `;
  }

  const addPermalinkPageControls = timelineElement => {
    if (timelineElement.querySelector(`[${controlsAttribute}]`) === null) {
      const { message, buttonText } = permalinkPageControls;
      const controlsElement = div({ class: controlsClass, [controlsAttribute]: id }, [
        message,
        br(),
        button({ click: () => controlsElement.remove() }, [buttonText]),
      ]);
      timelineElement.prepend(controlsElement);
    }
  };

  return {
    hidePost: postElement => {
      const timelineElement = postElement.closest(timelineSelector);
      const onPermalinkPage = anyPostPermalinkTimelineFilter(timelineElement);

      if (onPermalinkPage) {
        if (permalinkPageControls) {
          getTimelineItemWrapper(postElement).setAttribute(controlledHiddenAttribute, '');
          addPermalinkPageControls(timelineElement);
        } else {
          // do nothing; avoid hiding single post and making permalink page look broken
        }
      } else {
        getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
      }
    },
    showPost: postElement => {
      getTimelineItemWrapper(postElement).removeAttribute(hiddenAttribute);
    },
    showPosts: () => {
      $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
      $(`[${controlledHiddenAttribute}]`).removeAttr(controlledHiddenAttribute);
      $(`[${controlsAttribute}]`).remove();
    },
    hiddenAttribute,
    controlledHiddenAttribute,
    controlsAttribute,
  };
};
