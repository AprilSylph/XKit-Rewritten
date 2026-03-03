import { createPostHideFunctions } from '../../main_world/hide_posts.js';
import { keyToCss } from '../../utils/css_map.js';
import { getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const { hidePost, showPosts } = createPostHideFunctions({
  id: 'tweaks-hide-filtered-posts',
  controlsOnPermalinkPage: {
    message: 'This post contains filtered tags or content!',
    buttonText: 'show post anyway',
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
