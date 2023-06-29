import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
${keyToCss('createPost')} ${keyToCss('createPostButton')}, ${keyToCss('header')} ${keyToCss('postIconButton')} {
  background-color: rgba(var(--white-on-dark), .13);

  color: rgba(var(--white-on-dark), .65);
  --icon-color-primary: rgba(var(--white-on-dark), .65);
}
`);

export const main = async () => document.documentElement.append(styleElement);
export const clean = async () => styleElement.remove();
