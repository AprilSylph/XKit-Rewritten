import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const selector = `${keyToCss('textBlock')} ${keyToCss('quote', 'chat', 'quirky')}`;
const styleElement = buildStyle(`${selector} { font-family: var(--font-family); }`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
