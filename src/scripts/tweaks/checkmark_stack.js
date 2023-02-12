import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

let styleElementMaxCheckmarks = 0;
const styleElement = buildStyle();

const transitionStyleElement = buildStyle(`
  ${keyToCss('blueCheckmarksContainer')}, ${keyToCss('blueCheckmarkContainer')} {
    transition: margin 0.5s ease;
  }
`);

const updateStyleElement = maxCheckmarks => {
  styleElementMaxCheckmarks = maxCheckmarks;

  const range = [...Array(styleElementMaxCheckmarks).keys()].map(i => i + 1);
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

    ${range.map(i => `
      ${keyToCss('blueCheckmarkContainer')}:nth-last-child(${i}) {
        z-index: ${i};
      }
    `).join('')}
  `;
};

const processBlueCheckmarksContainer = blueCheckmarksContainers => {
  const maxCheckmarks = Math.max(...blueCheckmarksContainers.map(el => el.children.length));
  maxCheckmarks > styleElementMaxCheckmarks && updateStyleElement(maxCheckmarks);
};

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async () => {
  document.documentElement.append(styleElement);
  pageModifications.register(keyToCss('blueCheckmarksContainer'), processBlueCheckmarksContainer);

  waitForRender().then(() => document.documentElement.append(transitionStyleElement));
};

export const clean = async () => {
  pageModifications.unregister(processBlueCheckmarksContainer);
  styleElement.remove();
  transitionStyleElement.remove();
};
