import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const tagChicletWrapperSelector = await keyToCss('tagChicletWrapper');
  styleElement.textContent = `${tagChicletWrapperSelector} { background-image: none !important; color: rgb(var(--black)); background-color: rgb(var(--secondary-accent)); }`;

  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
