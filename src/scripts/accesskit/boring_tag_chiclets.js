import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('tagChicletWrapper')} {
    background-image: none !important;
    color: rgb(var(--black));
    background-color: rgb(var(--secondary-accent));
  }

  ${keyToCss('tagChicletWrapper')} > video,
  ${keyToCss('tagChicletWrapper')} > ${keyToCss('tagChicletBgShader')} {
    display: none !important;
  }
`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
