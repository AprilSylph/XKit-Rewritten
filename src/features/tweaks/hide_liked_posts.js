import { buildStyle, getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { isMyPost, timelineObject } from '../../utils/react_props.js';
import { followingTimelineFilter } from '../../utils/timeline_id.js';

const timeline = followingTimelineFilter;

const hiddenAttribute = 'data-tweaks-hide-liked-posts-hidden';
export const styleElement = buildStyle(`
[${hiddenAttribute}] {
  content: linear-gradient(transparent, transparent);
  height: 0;
}`);

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { liked } = await timelineObject(postElement);
    const myPost = await isMyPost(postElement);

    if (liked && !myPost) getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
