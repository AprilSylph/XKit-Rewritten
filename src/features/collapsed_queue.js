import { filterPostElements } from '../utils/interface.js';
import { getPreferences } from '../utils/preferences.js';
import { onNewPosts } from '../utils/mutations.js';
import { keyToCss } from '../utils/css_map.js';
import { anyQueueTimelineFilter, anyDraftsTimelineFilter } from '../utils/timeline_id.js';

const excludeClass = 'xkit-collapsed-queue-done';
const wrapperClass = 'xkit-collapsed-queue-wrapper';
const containerClass = 'xkit-collapsed-queue-container';
const footerSelector = keyToCss('footerWrapper');

let timeline;

const processPosts = postElements => {
  filterPostElements(postElements, { excludeClass, timeline }).forEach(async postElement => {
    const headerElement = postElement.querySelector('header');
    const footerElement = postElement.querySelector(footerSelector);

    const wrapper = Object.assign(document.createElement('div'), { className: wrapperClass });
    const container = Object.assign(document.createElement('div'), { className: containerClass });
    wrapper.append(container);

    headerElement.after(wrapper);
    while (wrapper.nextElementSibling !== footerElement) {
      container.append(wrapper.nextElementSibling);
    }
  });
};

export const main = async () => {
  const { runInQueue, runInDrafts } = await getPreferences('collapsed_queue');
  if (![runInQueue, runInDrafts].some(Boolean)) return;

  timeline = [
    runInQueue && anyQueueTimelineFilter,
    runInDrafts && anyDraftsTimelineFilter
  ].filter(Boolean);

  onNewPosts.addListener(processPosts);
};

export const clean = async () => {
  onNewPosts.removeListener(processPosts);

  [...document.querySelectorAll(`.${wrapperClass}`)].forEach(wrapper => {
    const container = wrapper.querySelector(`.${containerClass}`);
    wrapper.replaceWith(...container.children);
  });

  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
