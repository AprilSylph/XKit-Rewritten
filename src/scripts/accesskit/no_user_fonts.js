import { keyToCss, asyncSelector } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const quoteSelector = await asyncSelector`${keyToCss('textBlock')} ${keyToCss('quote')}`;
  const chatSelector = await asyncSelector`${keyToCss('textBlock')} ${keyToCss('chat')}`;
  const quirkySelector = await asyncSelector`${keyToCss('textBlock')} ${keyToCss('quirky')}`;

  styleElement.textContent = `${quoteSelector}, ${chatSelector}, ${quirkySelector} { font-family: var(--font-family); }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
