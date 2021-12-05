import { keyToClasses } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const countClasses = await keyToClasses('count');
  const countSelector = countClasses.map(className => `a[href$="/followers"] .${className}`).join(',');
  styleElement.textContent = `${countSelector} { visibility: hidden; } a[href$="/activity/total"] { display: none; }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
