import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { dom } from '../../utils/dom.js';

const labelSelector = `footer ${keyToCss('blogLinkWrapper')} ~ ${keyToCss('isOriginalPoster')}`;

const spanClass = 'xkit-tweaks-subtle-reply-span';

export const styleElement = buildStyle(`
.${spanClass} {
  display: inline-block;
  overflow-x: clip;

  width: var(--rendered-width);
}

${labelSelector}:not(:hover) .${spanClass} {
  width: 0;
}

${labelSelector}:not(:hover) > svg {
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
  label.insertBefore(span, textNode);
  textNode.textContent = '';

  span.style.setProperty('--rendered-width', `${span.getBoundingClientRect().width}px`);
  span.classList.add(spanClass);
});

const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

export const main = async function () {
  pageModifications.register(labelSelector, processLabels);
  waitForRender().then(() => document.documentElement.append(transitionStyleElement));
};

export const clean = async function () {
  pageModifications.unregister(processLabels);
  transitionStyleElement.remove();

  [...document.querySelectorAll(`.${spanClass}`)].forEach(span => {
    const textNode = document.createTextNode(span.textContent);
    span.parentNode.replaceChild(textNode, span);
  });
};
