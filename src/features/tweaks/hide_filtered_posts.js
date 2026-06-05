import { keyToCss } from '../../utils/css_map.js';
import { createPostHideFunctions } from '../../utils/hide_posts.js';
import { getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const { hidePost, showPosts } = createPostHideFunctions({
  id: 'tweaks-hide-filtered-posts',
  permalinkPageControls: {
    message: 'This post contains filtered tags or content.',
  },
});

const hideFilteredPosts = filteredScreens => filteredScreens
  .map(getTimelineItemWrapper)
  .forEach(hidePost);

export const main = async function () {
  const filteredScreenSelector = `article ${keyToCss('filteredScreen')}`;
  pageModifications.register(filteredScreenSelector, hideFilteredPosts);
};

export const clean = async function () {
  pageModifications.unregister(hideFilteredPosts);
  showPosts();
};
