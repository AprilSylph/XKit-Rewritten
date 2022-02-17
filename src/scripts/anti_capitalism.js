import { keyToCss, resolveExpressions } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';

const hiddenClass = 'xkit-anti-capitalism-hidden';

let listTimelineObjectInnerSelector;

const styleElement = buildStyle(`.${hiddenClass} { display: none !important; }\n`);
keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')
  .then(selector => {
    styleElement.textContent += `${selector} { display: none !important; }`;
  });

const processVideoCTAs = videoCTAs => videoCTAs
  .map(videoCTA => videoCTA.closest(listTimelineObjectInnerSelector))
  .filter(Boolean)
  .forEach(({ classList }) => classList.add(hiddenClass));

export const main = async () => {
  document.head.append(styleElement);

  listTimelineObjectInnerSelector = await keyToCss('listTimelineObjectInner');
  const videoCTASelector = await resolveExpressions`${listTimelineObjectInnerSelector}:first-child ${keyToCss('videoCTA')}`;
  pageModifications.register(videoCTASelector, processVideoCTAs);
};

export const clean = async () => {
  styleElement.remove();
  pageModifications.unregister(processVideoCTAs);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
