import { filterPostElements } from '../../utils/interface.js';
import { getPreferences } from '../../utils/preferences.js';
import { onNewPosts } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { anyQueueTimelineFilter, anyDraftsTimelineFilter } from '../../utils/timeline_id.js';
import { dom } from '../../utils/dom.js';

const wrapperClass = 'xkit-collapsed-queue-wrapper';
const containerClass = 'xkit-collapsed-queue-container';
const footerSelector = keyToCss('footerWrapper');

let timeline;

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    if (postElement.querySelector(`.${wrapperClass}`)) return;

    const headerElement = postElement.querySelector('header');
    const footerElement = postElement.querySelector(footerSelector);

    const wrapper = dom('div', { class: wrapperClass });
    const container = dom('div', { class: containerClass });
    wrapper.append(container);

    footerElement.before(wrapper);
    while (wrapper.previousElementSibling && wrapper.previousElementSibling !== headerElement) {
      container.prepend(wrapper.previousElementSibling);
    }
  });
};

export const main = async function () {
  const { runInQueue, runInDrafts } = await getPreferences('collapsed_queue');
  if (![runInQueue, runInDrafts].some(Boolean)) return;

  timeline = [
    runInQueue && anyQueueTimelineFilter,
    runInDrafts && anyDraftsTimelineFilter
  ].filter(Boolean);

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  [...document.querySelectorAll(`.${wrapperClass}`)].forEach(wrapper => {
    const container = wrapper.querySelector(`.${containerClass}`);
    wrapper.replaceWith(...container.children);
  });
};

export const stylesheet = true;
