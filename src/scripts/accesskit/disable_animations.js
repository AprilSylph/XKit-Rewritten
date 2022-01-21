import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const className = 'accesskit-disable-animations';

const styleElement = buildStyle();
keyToCss('postLikeHeartAnimation').then(selector => { styleElement.textContent = `${selector} { display: none; }`; });

export const main = async () => {
  document.body.classList.add(className);
  document.head.append(styleElement);
};

export const clean = async () => {
  document.body.classList.remove(className);
  styleElement.remove();
};
