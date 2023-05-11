import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const wrapper = `:is(article ${keyToCss('badgesContainer')})`;
const badgeContainer = `${wrapper} > ${keyToCss('badgeContainer')}`;
const badgeImage = `${badgeContainer} > :is(svg, img)`;

const styleElement = buildStyle(`
*:not(:hover) > ${wrapper} {
  margin-right: 7px;
}

*:not(:hover) > ${badgeContainer} {
  margin-right: -7px;
}

*:not(:hover) > ${badgeImage} {
  filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
}

${wrapper} {
  isolation: isolate;
}

${badgeContainer} {
  z-index: calc(0 - var(--badges-index));
}
`);

const transitionStyleElement = buildStyle(`
  ${wrapper}, ${badgeContainer} {
    transition: margin 0.5s ease;
  }

  ${badgeImage} {
    transition: filter 0.35s linear;
  }
`);

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async () => {
  document.documentElement.append(styleElement);
  waitForRender().then(() => document.documentElement.append(transitionStyleElement));
};

export const clean = async () => {
  styleElement.remove();
  transitionStyleElement.remove();
};
