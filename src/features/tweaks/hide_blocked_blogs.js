import { createPostHideFunctions } from '../../main_world/hide_posts.js';
import { filterPostElements } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { isMyPost, timelineObject } from '../../utils/react_props.js';
import { blogTimelineFilter, timelineSelector } from '../../utils/timeline_id.js';

const { hidePost, showPosts } = createPostHideFunctions({
  id: 'tweaks-hide-blocked-blogs',

  // Only applies to posts hidden by a blocked blog in the trail (see isTimelineExempt below)
  permalinkPageControls: {
    message: 'This post contains a blocked blog!',
    buttonText: 'show post anyway',
  },
});

const processPosts = (postElements) => {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const postIsMine = await isMyPost(postElement);
    if (postIsMine) return; // Filtering should not be applied to one's own posts

    const { blog = {}, trail = [] } = await timelineObject(postElement);
    const blockedBlogNames = new Set(
      [blog, ...trail.map(({ blog }) => blog)]
        .filter(Boolean)
        .filter(({ isBlockedFromPrimary }) => isBlockedFromPrimary)
        .map(({ name }) => name),
    );

    for (const blogName of blockedBlogNames) {
      const isTimelineExempt = blogTimelineFilter(blogName);
      const timelineElement = postElement.closest(timelineSelector);
      if (isTimelineExempt(timelineElement)) {
        // This blog is blocked, but we're on that blog's timeline.
        // Consider Tumblr's own warning interstitial to be sufficient.
        continue;
      }

      hidePost(postElement);
      break;
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  showPosts();
};
