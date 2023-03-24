import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

let styleElementMaxBadges = 0;
const styleElement = buildStyle();

const wrapper = `article ${keyToCss('badgesContainer')}`;
const badgeContainer = `${wrapper} > ${keyToCss('badgeContainer')}`;
const badgeImage = `${badgeContainer} > :is(svg, img)`;

const transitionStyleElement = buildStyle(`
  ${wrapper}, ${badgeContainer} {
    transition: margin 0.5s ease;
  }

  ${badgeImage} {
    transition: filter 0.35s linear;
  }
`);

const updateStyleElement = maxBadges => {
  styleElementMaxBadges = maxBadges;

  const range = [...Array(styleElementMaxBadges).keys()].map(i => i + 1);
  styleElement.textContent = `
    *:not(:hover) > ${wrapper} {
      margin-right: 10px;
    }

    *:not(:hover) > ${badgeContainer} {
      margin-right: -10px;
    }

    *:not(:hover) > ${badgeImage} {
      filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
    }

    ${wrapper} {
      isolation: isolate;
    }

    ${range.map(i => `
      ${badgeContainer}:nth-last-child(${i}) {
        z-index: ${i};
      }
    `).join('')}
  `;
};

const processWrappers = wrapperElements => {
  const maxBadges = Math.max(...wrapperElements.map(el => el.children.length));
  maxBadges > styleElementMaxBadges && updateStyleElement(maxBadges);
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
