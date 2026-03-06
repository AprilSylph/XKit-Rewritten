import { createPostHideFunctions } from '../../main_world/hide_posts.js';
import { filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { forYouTimelineFilter } from '../../utils/timeline_id.js';
import { joinedCommunityUuids } from '../../utils/user.js';

const timeline = forYouTimelineFilter;
const includeFiltered = true;

const { hidePost, showPosts } = createPostHideFunctions({ id: 'no-recommended-community-posts' });

const processPosts = postElements =>
  filterPostElements(postElements, { timeline, includeFiltered }).forEach(async postElement => {
    const { community } = await timelineObject(postElement);
    if (community && !joinedCommunityUuids.includes(community.uuid)) {
      hidePost(postElement);
    }
  });

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  showPosts();
};
