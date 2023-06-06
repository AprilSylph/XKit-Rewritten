import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';

const hiddenClass = 'xkit-anti-capitalism-hidden';

const listTimelineObjectInnerSelector = keyToCss('listTimelineObjectInner');

const styleElement = buildStyle(`
.${hiddenClass},
${keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner', 'cruelSummer')} {
  display: none !important;
}`
);

const chromiumStyleElement = buildStyle(`
${keyToCss('timelineOptionsItemWrapper')}:not(${keyToCss('active')}):has(> a[href="/dashboard/freeform_campaign"]) {
  display: none !important;
}`
);

const processVideoCTAs = videoCTAs => videoCTAs
  .map(videoCTA => videoCTA.closest(listTimelineObjectInnerSelector))
  .filter(Boolean)
  .forEach(({ classList }) => classList.add(hiddenClass));

export const main = async () => {
  document.documentElement.append(styleElement);
  document.documentElement.append(chromiumStyleElement);
  pageModifications.register(`${listTimelineObjectInnerSelector}:first-child ${keyToCss('videoCTA', 'videoImageCTA')}`, processVideoCTAs);
};

export const clean = async () => {
  pageModifications.unregister(processVideoCTAs);
  styleElement.remove();
  chromiumStyleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
