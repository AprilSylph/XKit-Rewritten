import { aside, svg, use } from './dom.js';
import { memoize } from './memoize.js';

const symbolsClassName = 'xkit-symbols';

// Remove outdated symbols on module load
$(`.${symbolsClassName}`).remove();

const symbols = aside({ class: symbolsClassName });
document.head.append(symbols);

const getSymbolId = memoize(featureName => {
  const symbolId = `${symbolsClassName}__${featureName}`;

  fetch(browser.runtime.getURL(`/features/${featureName}/icon.svg`))
    .then(result => new Promise(resolve => setTimeout(() => resolve(result), 2000)))
    .then(iconResponse => iconResponse.text())
    .then(iconText => new DOMParser().parseFromString(iconText, 'image/svg+xml').firstElementChild)
    .then(iconElement => {
      iconElement.setAttribute('id', symbolId);
      symbols.append(iconElement);
    });

  return symbolId;
});

/**
 * @param {string} featureName The internal name of a feature calling this utility (e.g. `"quick_tags"`)
 * @returns {SVGSVGElement} An SVG element that renders the icon for the specified feature
 */
export const getIcon = featureName => svg({}, [use({ href: `#${getSymbolId(featureName)}` })]);
