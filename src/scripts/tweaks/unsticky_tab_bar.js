import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle(`
  ${keyToCss('timelineHeader')}${keyToCss('sticky')} { position: static; transform: none; }
  ${keyToCss('post')} ${keyToCss('stickyContainer')} ${keyToCss('avatar')}${keyToCss('avatarUnderTabs')} { top: 69px; }
`);

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
