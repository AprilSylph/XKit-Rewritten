import { keyToClasses } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const cssTemplate = selector => `${selector} { box-shadow: none !important; }`;
const styleElement = buildStyle();

export const main = async function () {
  const selector = keyToClasses('listTimelineObject')
    .map(className => `.${className}:focus > div`)
    .join(',');

  styleElement.textContent = cssTemplate(selector);
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
