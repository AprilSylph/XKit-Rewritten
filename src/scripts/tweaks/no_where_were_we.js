import { descendantSelector } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const selector = await descendantSelector('wrapper', 'newPostIndicator');
  css = `${selector} { display: none; }`;
  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
