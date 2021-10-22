import { getPostElements } from '../util/interface.js';
import { exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-collapsed-queue-done';
const containerClass = 'queue_plus_shrink_container';
const containerClassInner = 'queue_plus_shrink_container_inner';
const containerClassShadow = 'queue_plus_shrink_container_shadow';

let timelineRegex;
let footerSelector;

const processPosts = async function () {
  await exposeTimelines();

  getPostElements({ excludeClass, timeline: timelineRegex }).forEach(async postElement => {
    const headerElement = postElement.querySelector('header');
    const footerElement = postElement.querySelector(footerSelector);

    const outer = Object.assign(document.createElement('div'), { className: containerClass });
    const inner = Object.assign(document.createElement('div'), { className: containerClassInner });
    const shadow = Object.assign(document.createElement('div'), { className: containerClassShadow });
    outer.append(shadow, inner);

    headerElement.after(outer);

    while (outer.nextElementSibling !== footerElement) {
      inner.append(outer.nextElementSibling);
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

  [...document.querySelectorAll(`.${containerClass}`)].forEach(outer => {
    const inner = outer.querySelector(`.${containerClassInner}`);
    outer.replaceWith(...inner.children);
  });

  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
