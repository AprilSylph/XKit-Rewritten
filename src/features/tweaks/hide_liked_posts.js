import { onNewPosts } from '../../utils/mutations.js';
import { buildStyle, getTimelineItemWrapper, filterPostElements } from '../../utils/interface.js';
import { isMyPost, timelineObject } from '../../utils/react_props.js';
import { followingTimelineFilter } from '../../utils/timeline_id.js';

const timeline = followingTimelineFilter;

const hiddenAttribute = 'data-tweaks-hide-liked-posts-hidden';

export const styleElement = buildStyle(`[${hiddenAttribute}] article { display: none; }`);

const processPosts = postElements => {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { liked } = await timelineObject(postElement);
    const myPost = await isMyPost(postElement);

    if (liked && !myPost) getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
  });
};

export const main = async () => {
  onNewPosts.addListener(processPosts);
};

export const clean = async () => {
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
