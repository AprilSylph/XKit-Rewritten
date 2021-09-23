import { descendantSelector } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const selector = await descendantSelector('wrapper', 'newPostIndicator');
  styleElement.textContent = `${selector} { display: none; }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
