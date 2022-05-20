import { keyToClasses } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const countSelector = keyToClasses('count')
    .map(className => `a[href$="/followers"] .${className}`)
    .join(',');

  styleElement.textContent = `${countSelector} { visibility: hidden; } a[href$="/activity/total"] { display: none; }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
