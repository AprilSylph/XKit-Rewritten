import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';

const playPauseSelector = `${keyToCss('overlayPoof')} ${keyToCss('overlay')} svg`;

export const styleElement = buildStyle(`
:not(${playPauseSelector}):not(${keyToCss('blockEditorContainer')} *) {
  animation: none !important;
  transition: none !important;
}

${playPauseSelector} {
  animation-timing-function: steps(1, jump-both);
}

${keyToCss('postLikeHeartAnimation')} {
  display: none;
}

canvas#fire-everywhere, [style*="--fire-container-height"] {
  display: none;
}
`);
