import { descendantSelector } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

export const main = async function () {
  const quoteSelector = await descendantSelector('textBlock', 'quote');
  const chatSelector = await descendantSelector('textBlock', 'chat');
  const quirkySelector = await descendantSelector('textBlock', 'quirky');

  css = `${quoteSelector}, ${chatSelector}, ${quirkySelector} { font-family: var(--font-family); }`;
  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
