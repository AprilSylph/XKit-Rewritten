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

    const postTimelineObject = await timelineObjectMemoized(postElement.dataset.id);

    {
      const { blog: { isAdult } } = postTimelineObject;
      if (isAdult) {
        postElement.classList.add(hiddenClass);
        return;
      }
    }

    const reblogs = postElement.querySelectorAll(reblogSelector);
    const { trail } = postTimelineObject;
    trail.forEach((trailItem, i) => {
      if (trailItem.blog === undefined) {
        return;
      }

      const { blog: { isAdult } } = trailItem;
      if (isAdult) {
        reblogs[i].classList.add(hiddenClass);
      }
    });
  });
};

export const main = async function () {
  const { onNewPosts } = await import('../util/mutations.js');
  const { keyToCss } = await import('../util/css_map.js');

  reblogSelector = await keyToCss('reblog');

  ({ blockingMode } = await getPreferences('cleanfeed'));

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  const { onNewPosts } = await import('../util/mutations.js');
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
