import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, getTimelineItemWrapper } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';

const hiddenAttribute = 'data-anti-capitalism-hidden';

const listTimelineObjectInnerSelector = keyToCss('listTimelineObjectInner');

export const styleElement = buildStyle();

const processVideoCTAs = videoCTAs => videoCTAs
  .map(getTimelineItemWrapper)
  .filter(Boolean)
  .forEach(timelineItem => timelineItem.setAttribute(hiddenAttribute, ''));

export const main = async () => {
  const { includeBlazed } = await getPreferences('anti_capitalism');
  const blazeFilter = includeBlazed
    ? ''
    : ':not(:has(header use[href="#managed-icon__ds-blaze-filled-16"]))';

  styleElement.textContent = `
    [${hiddenAttribute}] > div,
    ${keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')}${blazeFilter} {
      display: none !important;
    }
  `;

  pageModifications.register(
    `
      ${listTimelineObjectInnerSelector}:first-child ${keyToCss('videoCTA', 'videoImageCTA')},
      ${keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')}${blazeFilter}
    `,
    processVideoCTAs,
  );
};

export const clean = async () => {
  pageModifications.unregister(processVideoCTAs);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
