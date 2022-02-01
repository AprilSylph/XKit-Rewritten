import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();
resolveExpressions`article ${keyToCss('followButton')}`
  .then(selector => { styleElement.textContent = `${selector} { display: none; }`; });

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
