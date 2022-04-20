import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();
const playPauseSelector = resolveExpressions`${keyToCss('overlayPoof')} ${keyToCss('overlay')} svg`;

resolveExpressions`
:not(${playPauseSelector}) {
  animation: none !important;
  transition: none !important;
}

${playPauseSelector} {
  animation-timing-function: steps(1, jump-both);
}

${keyToCss('postLikeHeartAnimation')} {
  display: none;
}

canvas#fire-everywhere {
  display: none;
}
`.then(css => { styleElement.textContent = css; });

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
