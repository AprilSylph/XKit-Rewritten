import { keyToClasses } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { cartesian } from '../util/misc.js';

const styleElement = buildStyle();
styleElement.media = '(min-width: 990px)';

const mainCssTemplate = containerSelector => `
  ${containerSelector} {
    max-width: 100vw;
    padding-left: ${85 - 64}px;
    padding-right: 30px;
  }
  ${containerSelector} > :first-child {
    min-width: 0;
    max-width: none;
    flex: 1;
  }
  ${containerSelector} > :first-child > main { max-width: calc(100% - ${625 - 540}px); }
  ${containerSelector} > :first-child > main article { max-width: 100%; }
  ${containerSelector} > :first-child > main article > * { max-width: 100%; }
`;

const videoCssTemplate = videoBlock => `
  ${videoBlock} { max-width: none; }
  ${videoBlock} iframe { max-width: none !important; }
`;

const queueSettingsCssTemplate = queueSettings => `${queueSettings} {
  box-sizing: border-box;
  width: calc(100% - ${625 - 540}px);
}`;

export const main = async function () {
  styleElement.textContent = `#base-container > div > div > header { max-width: 100vw; padding-left: ${85 - 64}px; padding-right: 30px; }\n`;

  const sets = [];
  for (const key of ['bluespaceLayout', 'container']) {
    const set = await keyToClasses(key);
    sets.push(set.map(className => `.${className}`));
  }
  const containerSelectors = cartesian(...sets).map(classNames => classNames.join(' > '));
  styleElement.textContent += containerSelectors.map(mainCssTemplate).join('');

  const videoBlock = await keyToClasses('videoBlock');
  styleElement.textContent += `${videoBlock.map(className => `.${className}`).map(videoCssTemplate).join('')}`;

  const queueSettings = await keyToClasses('queueSettings');
  styleElement.textContent += `${queueSettings.map(className => `.${className}`).map(queueSettingsCssTemplate).join('')}`;

  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
