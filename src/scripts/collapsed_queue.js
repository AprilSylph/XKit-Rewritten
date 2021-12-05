import { getPostElements } from '../util/interface.js';
import { exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-collapsed-queue-done';
const shadowOuterClass = 'xkit-queue-shadow-outer';
const containerClass = 'xkit-collapsed-queue-container';

let timelineRegex;
let footerSelector;

const processPosts = async function () {
  await exposeTimelines();

  getPostElements({ excludeClass, timeline: timelineRegex }).forEach(async postElement => {
    const headerElement = postElement.querySelector('header');
    const footerElement = postElement.querySelector(footerSelector);

    const shadowOuter = Object.assign(document.createElement('div'), { className: shadowOuterClass });
    const container = Object.assign(document.createElement('div'), { className: containerClass });
    shadowOuter.append(container);

    headerElement.after(shadowOuter);
    while (shadowOuter.nextElementSibling !== footerElement) {
      container.append(shadowOuter.nextElementSibling);
    }
  });
};

export const main = async function () {
  const { runInQueue, runInDrafts } = await getPreferences('collapsed_queue');
  const regexGroup = [
    ...runInQueue ? ['queue'] : [],
    ...runInDrafts ? ['draft'] : []
  ].join('|');
  timelineRegex = new RegExp(String.raw`\/v2\/blog\/[^/]+\/posts\/(${regexGroup})`);

  footerSelector = await keyToCss('footerWrapper');

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  [...document.querySelectorAll(`.${shadowOuterClass}`)].forEach(outer => {
    const inner = outer.querySelector(`.${containerClass}`);
    outer.replaceWith(...inner.children);
  });

  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
