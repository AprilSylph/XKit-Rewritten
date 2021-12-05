import { descendantSelector } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  const quoteSelector = await descendantSelector('textBlock', 'quote');
  const chatSelector = await descendantSelector('textBlock', 'chat');
  const quirkySelector = await descendantSelector('textBlock', 'quirky');

  styleElement.textContent = `${quoteSelector}, ${chatSelector}, ${quirkySelector} { font-family: var(--font-family); }`;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
