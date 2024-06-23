import { onNewPosts } from '../../utils/mutations.js';
import { buildStyle, getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { isMyPost, timelineObject } from '../../utils/react_props.js';
import { timelineFilters } from '../../utils/timeline_id.js';

const timeline = timelineFilters.following();

const hiddenAttribute = 'data-tweaks-hide-liked-posts-hidden';
const styleElement = buildStyle(`[${hiddenAttribute}] article { display: none; }`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { liked } = await timelineObject(postElement);
    const myPost = await isMyPost(postElement);

    if (liked && !myPost) getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
