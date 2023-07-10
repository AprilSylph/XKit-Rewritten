import { pageModifications } from '../../util/mutations.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { dom } from '../../util/dom.js';

const labelSelector = keyToCss('generalLabelContainer');

const spanClass = 'xkit-tweaks-subtle-activity-span';

const styleElement = buildStyle(`
.${spanClass} {
  display: inline-block;
  overflow-x: clip;

  width: var(--rendered-width);
}

a:not(:hover) .${spanClass} {
  width: 0;
}

a:not(:hover) ${labelSelector} > svg {
  margin-left: 0;
}
`);

const transitionStyleElement = buildStyle(`
.${spanClass} {
  transition: width 0.2s ease;
}
${labelSelector} > svg {
  transition: margin 0.2s ease;
}
`);

const processLabels = labels => labels.forEach(label => {
  const textNode = label.firstChild;
  if (textNode.nodeName !== '#text') return;

  const span = dom('span', null, null, [textNode.textContent]);
  label.replaceChild(span, textNode);

  span.style.setProperty('--rendered-width', `${span.getBoundingClientRect().width}px`);
  span.classList.add(spanClass);
});

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async function () {
  pageModifications.register(labelSelector, processLabels);

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
