import { keyToClasses, keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const wrapper = `article ${keyToCss('badgesContainer')}`;
const badgeContainer = keyToCss('badgeContainer');
const badgeImage = ':is(svg, img)';

const prefix = 'xkit-badge-disabled';
const classesToDisable = keyToClasses('tooManyBadges', 'shrinkBadges');
const disableClassesSelector = `article ${keyToCss('tooManyBadges', 'shrinkBadges')}`;

const disableClasses = elements =>
  elements.forEach(element =>
    classesToDisable.forEach(className =>
      element.classList.replace(className, `${prefix}-${className}`)
    )
  );

const enableClasses = () =>
  [...document.querySelectorAll(`[class*="${prefix}"]`)].forEach(element =>
    classesToDisable.forEach(className =>
      element.classList.replace(`${prefix}-${className}`, className)
    )
  );

const styleElement = buildStyle(`
${wrapper} {
  width: unset !important
}

${wrapper}:not(:hover) > ${badgeContainer} {
  margin-right: 7px;
}

${wrapper}:not(:hover) > ${badgeContainer} > ${badgeImage} {
  margin-right: -7px !important;
  filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
}

${wrapper} > ${badgeContainer} {
  isolation: isolate;
}

${wrapper} > ${badgeContainer} > ${badgeImage} {
  position: relative;
  z-index: calc(0 - var(--badges-index));
}
`);

const transitionStyleElement = buildStyle(`
${badgeContainer}, ${badgeContainer} > ${badgeImage} {
  transition: margin 0.5s ease, filter 0.35s linear;
}
`);

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async () => {
  document.documentElement.append(styleElement);
  waitForRender().then(() => document.documentElement.append(transitionStyleElement));

  pageModifications.register(disableClassesSelector, disableClasses);
};

export const clean = async () => {
  pageModifications.unregister(disableClasses);
  enableClasses();

  styleElement.remove();
  transitionStyleElement.remove();
};
