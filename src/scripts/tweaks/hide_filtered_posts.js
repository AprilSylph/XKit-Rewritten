import { pageModifications } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../util/interface.js';

const hiddenAttribute = 'data-tweaks-hide-filtered-posts-hidden';
const styleElement = buildStyle(`[${hiddenAttribute}] article { display: none; }`);

const hideFilteredPosts = filteredScreens => filteredScreens
  .map(getTimelineItemWrapper)
  .forEach(timelineItem => timelineItem.setAttribute(hiddenAttribute, ''));

export const main = async function () {
  const filteredScreenSelector = `article ${keyToCss('filteredScreen')}`;
  pageModifications.register(filteredScreenSelector, hideFilteredPosts);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(hideFilteredPosts);
  styleElement.remove();

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
