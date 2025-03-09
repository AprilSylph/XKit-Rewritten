import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';

const hiddenAttribute = 'data-tweaks-hide-filtered-posts-hidden';

export const styleElement = buildStyle(`[${hiddenAttribute}] article { display: none; }`);

const hideFilteredPosts = filteredScreens => filteredScreens
  .map(getTimelineItemWrapper)
  .forEach(timelineItem => timelineItem.setAttribute(hiddenAttribute, ''));

export const main = async () => {
  const filteredScreenSelector = `article ${keyToCss('filteredScreen')}`;
  pageModifications.register(filteredScreenSelector, hideFilteredPosts);
};

export const clean = async () => {
  pageModifications.unregister(hideFilteredPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
