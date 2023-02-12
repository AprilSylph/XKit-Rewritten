import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

let styleElementMaxCheckmarks = 0;
const styleElement = buildStyle();

const wrapper = keyToCss('blueCheckmarksContainer');
const checkmarkContainer = `${wrapper} > ${keyToCss('blueCheckmarkContainer')}`;
const checkmarkImage = `${checkmarkContainer} > :is(svg, img)`;

const transitionStyleElement = buildStyle(`
  ${wrapper}, ${checkmarkContainer} {
    transition: margin 0.5s ease;
  }

  ${checkmarkImage} {
    transition: filter 0.35s linear;
  }
`);

const updateStyleElement = maxCheckmarks => {
  styleElementMaxCheckmarks = maxCheckmarks;

  const range = [...Array(styleElementMaxCheckmarks).keys()].map(i => i + 1);
  styleElement.textContent = `
    *:not(:hover) > ${wrapper} {
      margin-right: 10px;
    }

    *:not(:hover) > ${checkmarkContainer} {
      margin-right: -10px;
    }

    *:not(:hover) > ${checkmarkImage} {
      filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
    }

    ${wrapper} {
      isolation: isolate;
    }

    ${range.map(i => `
      ${checkmarkContainer}:nth-last-child(${i}) {
        z-index: ${i};
      }
    `).join('')}
  `;
};

const processWrappers = wrapperElements => {
  const maxCheckmarks = Math.max(...wrapperElements.map(el => el.children.length));
  maxCheckmarks > styleElementMaxCheckmarks && updateStyleElement(maxCheckmarks);
};

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async () => {
  document.documentElement.append(styleElement);
  pageModifications.register(wrapper, processWrappers);

  waitForRender().then(() => document.documentElement.append(transitionStyleElement));
};

export const clean = async () => {
  pageModifications.unregister(processWrappers);
  styleElement.remove();
  transitionStyleElement.remove();
};
