import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const selector = `${keyToCss('textBlock')} ${keyToCss('quote', 'chat', 'quirky')}`;
const styleElement = buildStyle(`${selector} { font-family: var(--font-family); }`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
