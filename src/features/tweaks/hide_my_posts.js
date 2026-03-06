import { createPostHideFunctions } from '../../main_world/hide_posts.js';
import { filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { isMyPost } from '../../utils/react_props.js';
import { followingTimelineFilter } from '../../utils/timeline_id.js';

const excludeClass = 'xkit-tweaks-hide-my-posts-done';
const timeline = followingTimelineFilter;

const { hidePost, showPosts } = createPostHideFunctions({ id: 'tweaks-hide-my-posts' });

const processPosts = async function (postElements) {
  filterPostElements(postElements, { excludeClass, timeline }).forEach(async postElement => {
    if (await isMyPost(postElement)) {
      hidePost(postElement);
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  showPosts();
};
