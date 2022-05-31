import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

export const main = async function () {
  styleElement.textContent = await resolveExpressions`
    article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')},
    article footer ${keyToCss('controlIcon')} ${keyToCss('tooltip')} ~ * {
      display: none;
    }
  `;
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
