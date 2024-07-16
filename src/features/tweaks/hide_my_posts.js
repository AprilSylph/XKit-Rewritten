import { onNewPosts } from '../../utils/mutations.js';
import { buildStyle, getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { isMyPost } from '../../utils/react_props.js';
import { followingTimelineFilter } from '../../utils/timeline_id.js';

const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const timeline = followingTimelineFilter;

const hiddenAttribute = 'data-tweaks-hide-my-posts-hidden';
const styleElement = buildStyle(`
[${hiddenAttribute}] {
  content: linear-gradient(transparent, transparent);
  height: 0;
}`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { excludeClass, timeline }).forEach(async postElement => {
    const myPost = await isMyPost(postElement);

    if (myPost) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
