import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';

const styleElement = buildStyle();
keyToCss('adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner')
  .then(selector => {
    styleElement.textContent = `${selector} { display: none !important; }`;
  });

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
