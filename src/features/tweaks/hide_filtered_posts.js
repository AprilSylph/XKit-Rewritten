import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-tweaks-hide-filtered-posts-hidden';
export const styleElement = buildStyle(`
[${hiddenAttribute}] {
  content: linear-gradient(transparent, transparent);
  height: 0;
}`);

const hideFilteredPosts = filteredScreens => filteredScreens
  .map(getTimelineItemWrapper)
  .forEach(timelineItem => timelineItem.setAttribute(hiddenAttribute, ''));

export const main = async function () {
  const filteredScreenSelector = `article ${keyToCss('filteredScreen')}`;
  pageModifications.register(filteredScreenSelector, hideFilteredPosts);
};

export const clean = async function () {
  pageModifications.unregister(hideFilteredPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
