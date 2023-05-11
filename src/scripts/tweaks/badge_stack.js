import { keyToClasses, keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const wrapper = `article ${keyToCss('badgesContainer')}`;
const badgeContainer = keyToCss('badgeContainer');
const badgeImage = ':is(svg, img)';

const prefix = 'xkit-badge-disabled';
const classesToDisable = keyToClasses('tooManyBadges', 'shrinkBadges');
const disableClassesSelector = keyToCss('tooManyBadges', 'shrinkBadges');

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
${wrapper}:not(:hover) {
  margin-right: 7px;
}

${wrapper}:not(:hover) > ${badgeContainer} {
  margin-right: -7px;
}

${wrapper}:not(:hover) > ${badgeContainer} > ${badgeImage} {
  filter: drop-shadow(1px 0px 2px rgb(0 0 0 / 0.5));
}

${wrapper} {
  isolation: isolate;
}

${wrapper} > ${badgeContainer} {
  z-index: calc(0 - var(--badges-index));
}
`);

const transitionStyleElement = buildStyle(`
${wrapper}, ${wrapper} > ${badgeContainer} {
  transition: margin 0.5s ease;
}

${wrapper} > ${badgeContainer} > ${badgeImage} {
  transition: filter 0.35s linear;
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
