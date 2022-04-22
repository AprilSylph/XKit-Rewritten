import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();
resolveExpressions`
${keyToCss('tags')}${keyToCss('collapsed')} {
  max-height: inherit;
}
${keyToCss('seeAll')} {
  display: none;
}
`.then(css => { styleElement.textContent = css; });

export const main = async function () {
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
