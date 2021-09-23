import { descendantSelector } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const selector = await descendantSelector('post', 'followButton');
  styleElement.textContent = `${selector} { color: rgba(var(--black), 0.4); }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
