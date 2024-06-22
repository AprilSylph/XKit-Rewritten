import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const hiddenAttribute = 'data-no-recommended-tag-carousels-hidden';

const styleElement = buildStyle(`
  [${hiddenAttribute}] { position: relative; }
  [${hiddenAttribute}] > div { visibility: hidden; position: absolute; max-width: 100%; }
  [${hiddenAttribute}] > div img, [${hiddenAttribute}] > div canvas { visibility: hidden; }
`);

const tagCardSelector = keyToCss('tagCard');
const listTimelineObjectSelector = keyToCss('listTimelineObject');
const carouselWrapperSelector = `${listTimelineObjectSelector} ${keyToCss('carouselWrapper')}`;

const hideTagCarousels = carouselWrappers => carouselWrappers
  .filter(carouselWrapper => carouselWrapper.querySelector(tagCardSelector) !== null)
  .map(getTimelineItemWrapper)
  .forEach(timelineItem => {
    timelineItem.setAttribute(hiddenAttribute, '');
    timelineItem.previousElementSibling.setAttribute(hiddenAttribute, '');
  });

export const main = async function () {
  document.documentElement.append(styleElement);
  pageModifications.register(carouselWrapperSelector, hideTagCarousels);
};

export const clean = async function () {
  pageModifications.unregister(hideTagCarousels);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
