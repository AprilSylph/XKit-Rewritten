import { getCssMap } from '../util/tumblr_helpers.js';
import { buildStyle } from '../util/interface.js';

const styleElement = buildStyle();
getCssMap
  .then(cssMap => ['adTimelineObject', 'instreamAd', 'mrecContainer', 'nativeIponWebAd', 'takeoverBanner']
    .flatMap(key => cssMap[key])
    .map(className => `.${className}`)
    .join(', ')
  )
  .then(selector => {
    styleElement.textContent = `${selector} { display: none !important; }`;
  });

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
