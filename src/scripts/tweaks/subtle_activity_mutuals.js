import { pageModifications } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { dom } from '../../util/dom.js';

const spanClass = 'xkit-tweaks-subtle-activity-span';

const styleElement = buildStyle(`
${keyToCss('generalLabelContainer')} > .${spanClass} {
  display: inline-block;
  overflow-x: clip;
  width: calc(100% - 16px);
}

a:not(:hover) ${keyToCss('generalLabelContainer')} > svg {
  margin-left: 0;
}

a:not(:hover) ${keyToCss('generalLabelContainer')} > .${spanClass} {
   width: 0;
}
`);

const transitionStyleElement = buildStyle(`
${keyToCss('generalLabelContainer')} > svg, .${spanClass} {
  transition: width 0.5s ease, margin 0.5s ease;
}
`);

const processLabels = labels => labels.forEach(label => {
  const textNode = label.firstChild;
  if (textNode.nodeName !== '#text') return;

  const span = dom('span', { class: spanClass }, null, [textNode.textContent]);
  label.replaceChild(span, textNode);
});

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async function () {
  pageModifications.register(keyToCss('generalLabelContainer'), processLabels);

  document.documentElement.append(styleElement);
  waitForRender().then(() => document.documentElement.append(transitionStyleElement));
};

export const clean = async function () {
  pageModifications.unregister(processLabels);
  styleElement.remove();
  transitionStyleElement.remove();

  [...document.querySelectorAll(`.${spanClass}`)].forEach(span => {
    const textNode = document.createTextNode(span.textContent);
    span.parentNode.replaceChild(textNode, span);
  });
};
