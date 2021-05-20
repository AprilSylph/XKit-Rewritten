import { keyToCss } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const tagChicletWrapperSelector = await keyToCss('tagChicletWrapper');
  css = `${tagChicletWrapperSelector} { background-image: none !important; color: rgb(var(--black)); background-color: rgb(var(--secondary-accent)); }`;

  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
