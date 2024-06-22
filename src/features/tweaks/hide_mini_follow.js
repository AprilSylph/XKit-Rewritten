import { buildStyle } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';

const styleElement = buildStyle(`article button[aria-label="${translate('Follow')}"] { display: none; }`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
