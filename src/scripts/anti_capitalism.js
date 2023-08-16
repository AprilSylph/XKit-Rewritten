import { keyToCss } from '../util/css_map.js';
import { buildStyle, closestTimelineItem } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';

const hiddenAttribute = 'data-anti-capitalism-hidden';

const listTimelineObjectInnerSelector = keyToCss('listTimelineObjectInner');

const styleElement = buildStyle(`
[${hiddenAttribute}] > div,
${keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')} {
  display: none !important;
}`
);

const processVideoCTAs = videoCTAs => videoCTAs
  .map(closestTimelineItem)
  .filter(Boolean)
  .forEach(timelineItem => timelineItem.setAttribute(hiddenAttribute, ''));

export const main = async () => {
  document.documentElement.append(styleElement);
  pageModifications.register(
    `
      ${listTimelineObjectInnerSelector}:first-child ${keyToCss('videoCTA', 'videoImageCTA')},
      ${keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')}
    `,
    processVideoCTAs
  );
};

export const clean = async () => {
  pageModifications.unregister(processVideoCTAs);
  styleElement.remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
