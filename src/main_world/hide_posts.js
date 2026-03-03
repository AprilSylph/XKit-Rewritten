import { br, button, div } from '../utils/dom.js';
import { buildStyle, getTimelineItemWrapper } from '../utils/interface.js';
import { anyPostPermalinkTimelineFilter, timelineSelector } from '../utils/timeline_id.js';

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

export const createPostHideFunctions = ({ id, controlsOnPermalinkPage, hideAutomatically = true }) => {
  const hiddenAttribute = `data-xkit-${id}-hidden`;

  const controlledHiddenAttribute = `data-xkit-${id}-hidden-controlled`;
  const controlsAttribute = `data-xkit-${id}-hidden-controls`;

  if (hideAutomatically) {
    styleElement.textContent += `
      [${hiddenAttribute}], [${controlsAttribute}] ~ div [${controlledHiddenAttribute}] {
        content: linear-gradient(transparent, transparent);
        height: 0;
      }
    `;
  }

  return {
    hidePost: postElement => {
      const timelineElement = postElement.closest(timelineSelector);

      if (anyPostPermalinkTimelineFilter(timelineElement)) {
        if (controlsOnPermalinkPage) {
          getTimelineItemWrapper(postElement).setAttribute(controlledHiddenAttribute, '');

          if (timelineElement.querySelector(`[${controlsAttribute}]`) === null) {
            const { message, buttonText } = controlsOnPermalinkPage;
            const controlsElement = div({ class: controlsClass, [controlsAttribute]: id }, [
              message,
              br(),
              button({ click: () => controlsElement.remove() }, [buttonText]),
            ]);
            timelineElement.prepend(controlsElement);
          }
        }
        return;
      }

      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
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
