import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const selector = await resolveExpressions`${keyToCss('textBlock')} ${keyToCss('quote', 'chat', 'quirky')}`;

  styleElement.textContent = `${selector} { font-family: var(--font-family); }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
