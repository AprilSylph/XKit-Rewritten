import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';

const container = `${keyToCss('bluespaceLayout')} > ${keyToCss('container')}`;
const reblog = `${keyToCss('post')} ${keyToCss('reblog')}`;
const videoBlock = keyToCss('videoBlock');
const queueSettings = keyToCss('queueSettings');

const maxPostWidth = '640px';

const styleElement = buildStyle(`
#base-container > div > div > header,
${container} {
  max-width: min(100vw, 1716px);
  padding-left: ${85 - 64}px;
  padding-right: 30px;
}

${container} {
  justify-content: center;
}

${container} > :first-child {
  min-width: 0;
  max-width: ${maxPostWidth};
  padding-left: ${625 - 540}px;
  flex: 1;
}
${container} > :first-child > main { max-width: none; }
${container} > :first-child > main article { max-width: 100%; }
${container} > :first-child > main article > * { max-width: 100%; }

${reblog} { max-width: none; }
${videoBlock} { max-width: none; }
${videoBlock} iframe { max-width: none !important; }

${queueSettings} {
  box-sizing: border-box;
  width: 100%;
}
`);
styleElement.media = '(min-width: 990px)';

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
