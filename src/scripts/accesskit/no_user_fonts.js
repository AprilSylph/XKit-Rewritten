import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const quoteSelector = await resolveExpressions`${keyToCss('textBlock')} ${keyToCss('quote')}`;
  const chatSelector = await resolveExpressions`${keyToCss('textBlock')} ${keyToCss('chat')}`;
  const quirkySelector = await resolveExpressions`${keyToCss('textBlock')} ${keyToCss('quirky')}`;

  styleElement.textContent = `${quoteSelector}, ${chatSelector}, ${quirkySelector} { font-family: var(--font-family); }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
