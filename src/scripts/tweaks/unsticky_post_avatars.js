import { keyToCss } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const stickyContainerSelector = await keyToCss('stickyContainer');
  css = `${stickyContainerSelector} { height: auto !important; }`;

  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
