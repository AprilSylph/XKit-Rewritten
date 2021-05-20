import { keyToClasses } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

const cssTemplate = selector => `${selector} { box-shadow: none !important; }`;
let css;

export const main = async function () {
  const listTimelineObjectClasses = await keyToClasses('listTimelineObject');
  const selector = listTimelineObjectClasses.map(className => `.${className}:focus > div`).join(',');
  css = cssTemplate(selector);

  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
