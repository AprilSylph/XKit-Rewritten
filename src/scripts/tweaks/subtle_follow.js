import { descendantSelector } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const selector = await descendantSelector('post', 'followButton');
  css = `${selector} { color: rgba(var(--black), 0.4); }`;
  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
