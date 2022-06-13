import { keyToClasses } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const selector = keyToClasses('listTimelineObject').map(className => `.${className}:focus > div`).join(',');
const styleElement = buildStyle(`${selector} { box-shadow: none !important; }`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
