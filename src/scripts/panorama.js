import { keyToCss, resolveExpressions } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';

const styleElement = buildStyle();
styleElement.media = '(min-width: 990px)';

const container = resolveExpressions`${keyToCss('bluespaceLayout')} > ${keyToCss('container')}`;
const reblog = resolveExpressions`${keyToCss('post')} ${keyToCss('reblog')}`;
const videoBlock = keyToCss('videoBlock');
const queueSettings = keyToCss('queueSettings');

resolveExpressions`
  #base-container > div > div > header,
  ${container} {
    max-width: 100vw;
    padding-left: ${85 - 64}px;
    padding-right: 30px;
  }

  ${container} > :first-child {
    min-width: 0;
    max-width: none;
    flex: 1;
  }

  ${container} > :first-child > main { max-width: calc(100% - ${625 - 540}px); }
  ${container} > :first-child > main article { max-width: 100%; }
  ${container} > :first-child > main article > * { max-width: 100%; }

  ${reblog} { max-width: none; }
  ${videoBlock} { max-width: none; }
  ${videoBlock} iframe { max-width: none !important; }

  ${queueSettings} {
    box-sizing: border-box;
    width: calc(100% - ${625 - 540}px);
  }
`.then(styles => { styleElement.textContent = styles; });

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
