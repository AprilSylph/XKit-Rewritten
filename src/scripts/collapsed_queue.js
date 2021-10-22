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
    const $post = $(postElement).find('article').first();
    const $header = $post.find('header').first();

    $header.next().css('margin', 0);

    $header.nextUntil(footerSelector)
      .wrapAll(`<div class="${containerClass}"><div class="${containerClassInner}"></div></div>`)
      .parent().before(`<div class="${containerClassShadow}"></div>`);
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

  $(`.${containerClassShadow}`).remove();
  $(`.${containerClassInner}`).unwrap();
  $(`.${containerClassInner}`).each(function () {
    $(this).children().first().unwrap();
  });

  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
