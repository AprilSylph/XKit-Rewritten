import { keyToClasses, keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const wrapper = keyToCss('leftContent');
const badgeContainer = keyToCss('badgeContainer');
const badgeImage = ':is(svg, img)';

const stackedClass = 'xkit-tweaks-badge-stacked';

const prefix = 'xkit-badge-disabled';
const keysToDisable = ['tooManyBadges', 'shrinkBadges', 'shouldStack'];
const classesToDisable = keyToClasses(...keysToDisable);
const disableClassesSelector = `article ${keyToCss(...keysToDisable)}`;

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

${wrapper}:not(:hover) .${stackedClass} {
  margin-right: -7px;
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

const processBadges = badgeContainers =>
  badgeContainers
    .filter(badge => badge.nextElementSibling?.matches(badgeContainer))
    .forEach(badge => badge.classList.add(stackedClass));

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async () => {
  document.documentElement.append(styleElement);
  waitForRender().then(() => document.documentElement.append(transitionStyleElement));

  pageModifications.register(`${wrapper} ${badgeContainer}`, processBadges);
  pageModifications.register(disableClassesSelector, disableClasses);
};

export const clean = async () => {
  pageModifications.unregister(disableClasses);
  enableClasses();

  styleElement.remove();
  transitionStyleElement.remove();

  $(`.${stackedClass}`).removeClass(stackedClass);
};
