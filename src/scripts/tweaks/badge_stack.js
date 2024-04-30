import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const wrapper = keyToCss('leftContent');
const badgeContainer = keyToCss('badgeContainer');
const badgeImage = ':is(svg, img)';

const styleElement = buildStyle(`

${wrapper}:not(:hover) ${badgeContainer} + ${badgeContainer} {
  margin-left: -7px;
}

${wrapper}:not(:hover) ${badgeContainer} ${badgeImage} {
  filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
}

${wrapper} {
  margin-right: 7px;
  isolation: isolate;
}

/**
 * this reversal of the regular stacking order must be removed on hover or the popups
 * break, though it causes slight visual corruption during the animation ;(
 */
${wrapper}:not(:hover) ${badgeContainer} {
  position: relative;
  z-index: calc(0 - var(--badges-index));
}
`);

const transitionStyleElement = buildStyle(`
${badgeContainer} {
  transition: margin 0.5s ease;
}
${badgeContainer} ${badgeImage} {
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
