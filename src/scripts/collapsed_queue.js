import { getPostElements } from '../util/interface.js';
import { exposeTimelines } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';

const excludeClass = 'xkit-collapsed-queue-done';
const doneClass = 'xkit-collapsed-queue-collapsed';

let footerSelector;

const processPosts = async function () {
  await exposeTimelines();

  getPostElements({ excludeClass, timeline: /\/v2\/blog\/[^/]+\/posts\/queue/ }).forEach(async postElement => {
    postElement.classList.add(doneClass);

    const $post = $(postElement).find('article').first();
    const $header = $post.find('header').first();

    $header.next().css('margin', 0);

    $header.nextUntil(footerSelector)
      .wrapAll('<div class="queue_plus_shrink_container"><div class="queue_plus_shrink_container_inner"></div></div>')
      .parent().before('<div class="queue_plus_shrink_container_shadow"></div>');
  });
};

export const main = async function () {
  // ({  } = await getPreferences('collapsed_queue'));
  footerSelector = await keyToCss('footerWrapper');

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${doneClass}`).removeClass(doneClass);
};

export const stylesheet = true;
