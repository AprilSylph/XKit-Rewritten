import { keyToClasses } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const countSelector = keyToClasses('count').map(className => `a[href$="/followers"] .${className}`).join(',');
const styleElement = buildStyle(`
${countSelector} {
  visibility: hidden;
}
a[href$="/activity/total"] {
  display: none;
}`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
