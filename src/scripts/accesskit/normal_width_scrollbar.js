import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const className = 'accesskit-normal-width-scrollbar';
const styleElement = buildStyle(`
  .${className}
  ${keyToCss('timelineHeaderNavInner')} { 
    scrollbar-width: none; 
}`
);

export const main = async () => {
  document.documentElement.classList.add(className);
  document.body.classList.add(className);
  document.documentElement.append(styleElement);
};
export const clean = async () => {
  document.documentElement.classList.remove(className);
  document.body.classList.remove(className);
  styleElement.remove();
};
