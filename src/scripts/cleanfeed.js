import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { getPostElements } from '../util/interface.js';
import { timelineObjectMemoized } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';

let blockingMode;
let reblogSelector;

const excludeClass = 'xkit-cleanfeed-done';
const hiddenClass = 'xkit-cleanfeed-filtered';

const processPosts = async function () {
  getPostElements({ excludeClass }).forEach(async postElement => {
    if (blockingMode === 'all') {
      postElement.classList.add(hiddenClass);
      return;
    }

    const { blog: { isAdult }, trail } = await timelineObjectMemoized(postElement.dataset.id);

    if (isAdult) {
      postElement.classList.add(hiddenClass);
      return;
    }

    const reblogs = postElement.querySelectorAll(reblogSelector);
    trail.forEach((trailItem, i) => {
      if (trailItem.blog?.isAdult) {
        reblogs[i].classList.add(hiddenClass);
      }
    });
  });
};

export const main = async function () {
  reblogSelector = await keyToCss('reblog');

  ({ blockingMode } = await getPreferences('cleanfeed'));

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
