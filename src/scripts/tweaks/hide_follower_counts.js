import { keyToClasses } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const countClasses = await keyToClasses('count');
  const countSelector = countClasses.map(className => `a[href$="/followers"] .${className}`).join(',');
  css = `${countSelector} { visibility: hidden; } a[href$="/activity/total"] { display: none; }`;

  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
