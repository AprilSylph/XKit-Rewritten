import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const styleElement = buildStyle(`
${keyToCss('tags')}${keyToCss('collapsed')} {
  max-height: none !important;
}
${keyToCss('seeAll')} {
  display: none;
}
`);

export const main = async function () {
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
