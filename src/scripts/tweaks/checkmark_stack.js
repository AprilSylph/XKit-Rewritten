import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

let styleElementMax = 0;
const styleElement = buildStyle();

const updateStyleElement = count => {
  if (count > styleElementMax) {
    styleElementMax = count;

    styleElement.textContent = `
      ${keyToCss('blueCheckmarksContainer')}, ${keyToCss('blueCheckmarkContainer')} {
        transition: margin 0.5s ease;
      }

      *:not(:hover) > ${keyToCss('blueCheckmarksContainer')} ${keyToCss('blueCheckmarkContainer')} {
        margin-right: -10px;
      }

      *:not(:hover) > ${keyToCss('blueCheckmarksContainer')} {
        margin-right: 10px;
      }

      ${keyToCss('blueCheckmarkContainer')} > :is(svg, img) {
        filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
      }

      ${keyToCss('blueCheckmarksContainer')} {
        isolation: isolate;
      }

    ` + [...Array(styleElementMax).keys()].map(i => i + 1).map(i => `
          ${keyToCss('blueCheckmarkContainer')}:nth-last-child(${i}) {
            z-index: ${i};
          }
        `).join('');
  }
};

const processBlueCheckmarksContainer = blueCheckmarksContainers =>
  updateStyleElement(Math.max(...blueCheckmarksContainers.map(el => el.children.length)));

export const main = async () => {
  document.head.append(styleElement);
  pageModifications.register(keyToCss('blueCheckmarksContainer'), processBlueCheckmarksContainer);
};

export const clean = async () => {
  pageModifications.unregister(processBlueCheckmarksContainer);
  styleElement.remove();
};
