import { keyToClasses } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const countClasses = await keyToClasses('count');
  const selector = countClasses.map(className => `a[href$="/followers"] .${className}`).join(',');
  css = `${selector} { visibility: hidden; }`;

  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
