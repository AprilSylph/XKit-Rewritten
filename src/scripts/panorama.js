import { keyToCss } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';

const container = `${keyToCss('bluespaceLayout')} > ${keyToCss('container')}:not(${keyToCss('mainContentIs4ColumnMasonry')})`;
const reblog = `${keyToCss('post')} ${keyToCss('reblog')}`;
const videoBlock = keyToCss('videoBlock');
const audioBlock = keyToCss('audioBlock');
const link = `${keyToCss('rows')} > ${keyToCss('link')}`;
const linkImage = `${keyToCss('header')}${keyToCss('withImage')}`;
const queueSettings = keyToCss('queueSettings');

const taggedPageColumn = `${keyToCss('postMasonry')} > ${keyToCss('postColumn')}`;

const styleElement = buildStyle();
styleElement.media = '(min-width: 990px)';

export const main = async () => {
  const { maxPostWidth: maxPostWidthPref } = await getPreferences('panorama');

  const maxPostWidth = maxPostWidthPref
    .trim()
    .replace('%', 'vw')
    .replace(/^(\d+)$/, '$&px') || '100vw';

  styleElement.textContent = `
    #base-container > div > div > header,
    ${container} {
      max-width: 100vw;
      padding-left: ${85 - 64}px;
      padding-right: 30px;
    }

    ${container} {
      justify-content: center;
    }

    ${container} > :first-child:not(${keyToCss('scrollContainer')}) {
      min-width: 0;
      max-width: max(${maxPostWidth} + 85px, 385px);
      flex: 1;
    }

    ${container} > :first-child > main { max-width: calc(100% - ${625 - 540}px); }
    ${container} > :first-child > main article { max-width: 100%; }
    ${container} > :first-child > main article > * { max-width: 100%; }

    ${reblog} { max-width: none; }
    ${videoBlock} { max-width: none; }
    ${videoBlock} iframe { max-width: none !important; }
    ${audioBlock} { max-width: none; }
    ${link} { max-width: none; }
    ${link} ${linkImage} { height: unset; }

    ${taggedPageColumn} { max-width: none; }

    ${queueSettings} {
      box-sizing: border-box;
      width: calc(100% - ${625 - 540}px);
    }

    /* embedded blog view visual corruption fix */
    ${keyToCss('container')} > [style*="--blog-title-color"] {
      max-width: 960px;
      margin-left: auto;
      margin-right: auto;
    }
  `;

  document.documentElement.append(styleElement);
};

export const clean = async () => styleElement.remove();
