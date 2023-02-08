import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

let styleElementMax = 0;
const styleElement = buildStyle();

const transitionStyleElement = buildStyle(`
  ${keyToCss('blueCheckmarksContainer')}, ${keyToCss('blueCheckmarkContainer')} {
    transition: margin 0.5s ease;
  }
`);

const updateStyleElement = count => {
  if (count > styleElementMax) {
    styleElementMax = count;

    styleElement.textContent = `
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

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async () => {
  document.head.append(styleElement);
  pageModifications.register(keyToCss('blueCheckmarksContainer'), processBlueCheckmarksContainer);

  waitForRender().then(() => document.head.append(transitionStyleElement));
};

export const clean = async () => {
  pageModifications.unregister(processBlueCheckmarksContainer);
  styleElement.remove();
  transitionStyleElement.remove();
};
