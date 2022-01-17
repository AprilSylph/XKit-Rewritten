import { getPostElements } from '../util/interface.js';
import { exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-collapsed-queue-done';
const wrapperClass = 'xkit-collapsed-queue-wrapper';
const containerClass = 'xkit-collapsed-queue-container';

let timelineRegex;
let footerSelector;

const processPosts = async function () {
  await exposeTimelines();

  getPostElements({ excludeClass, timeline: timelineRegex }).forEach(async postElement => {
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

export const main = async function () {
  const { runInQueue, runInDrafts } = await getPreferences('collapsed_queue');
  const regexGroup = [
    ...runInQueue ? ['queue'] : [],
    ...runInDrafts ? ['draft'] : []
  ].join('|');
  timelineRegex = new RegExp(`/v2/blog/[^/]+/posts/(${regexGroup})`);

  footerSelector = await keyToCss('footerWrapper');

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  [...document.querySelectorAll(`.${wrapperClass}`)].forEach(wrapper => {
    const container = wrapper.querySelector(`.${containerClass}`);
    wrapper.replaceWith(...container.children);
  });

  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
