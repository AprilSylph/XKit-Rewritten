import { createPostHideFunctions } from '../../main_world/hide_posts.js';
import { filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { isMyPost, timelineObject } from '../../utils/react_props.js';
import { followingTimelineFilter } from '../../utils/timeline_id.js';

const timeline = followingTimelineFilter;

const { hidePost, showPosts } = createPostHideFunctions({ id: 'tweaks-hide-liked-posts' });

const processPosts = async function (postElements) {
  filterPostElements(postElements, { timeline }).forEach(async postElement => {
    const { liked } = await timelineObject(postElement);
    const myPost = await isMyPost(postElement);

    if (liked && !myPost) hidePost(postElement);
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  showPosts();
};
