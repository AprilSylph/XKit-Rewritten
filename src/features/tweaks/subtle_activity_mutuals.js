import { pageModifications } from '../../utils/mutations.js';
import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { dom } from '../../utils/dom.js';

const labelSelector = `${keyToCss('followingBadgeContainer', 'mutualsBadgeContainer')}:is(${keyToCss('activity', 'activityItem')} *)`;

const spanClass = 'xkit-tweaks-subtle-activity-span';
const iconClass = 'xkit-tweaks-subtle-activity-icon';

export const styleElement = buildStyle(`
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

.${iconClass} {
  vertical-align: middle;
  margin-left: 4px;
  position: relative;
  bottom: 1px;
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

  const iconHref = label.matches(keyToCss('mutualsBadgeContainer'))
    ? '#managed-icon__profile-double'
    : '#managed-icon__profile-checkmark';

  if (!label.querySelector(`:scope > svg:not(.${iconClass})`) && document.querySelector(iconHref)) {
    label.append(
      dom(
        'svg',
        { class: iconClass, width: 14, height: 14, xmlns: 'http://www.w3.org/2000/svg' },
        null,
        [dom('use', { href: iconHref, xmlns: 'http://www.w3.org/2000/svg' })]
      )
    );
  }
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
  $(`.${iconClass}`).remove();
};
