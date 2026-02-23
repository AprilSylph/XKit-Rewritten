import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const labelSelector = `${keyToCss('activity', 'activityItem')} ${keyToCss('followingBadgeContainer', 'mutualsBadgeContainer')}`;

const spanClass = 'xkit-tweaks-subtle-activity-span';
const iconClass = 'xkit-tweaks-subtle-activity-icon';

export const styleElement = buildStyle(`
.${spanClass} {
  display: inline-block;
  overflow-x: clip;

  width: var(--rendered-width);
}

${keyToCss('tumblelogName', 'activityHeader')}:not(:hover) .${spanClass} {
  width: 0;
}

${keyToCss('tumblelogName', 'activityHeader')}:not(:hover) :is(${labelSelector}) > svg {
  margin-left: 0;
}

${keyToCss('activityHeader')} div:has(> .${spanClass}) {
  /* fixes hover detection when covered by the "activityItemLink" <a> element */
  isolation: isolate;
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

  if (!label.querySelector('svg')) {
    const iconHref = label.matches(keyToCss('mutualsBadgeContainer'))
      ? '#managed-icon__profile-double'
      : '#managed-icon__profile-checkmark';

    if (!document.querySelector(iconHref)) return;

    label.append(
      dom(
        'svg',
        { class: iconClass, width: 14, height: 14, xmlns: 'http://www.w3.org/2000/svg' },
        null,
        [dom('use', { href: iconHref, xmlns: 'http://www.w3.org/2000/svg' })],
      ),
    );
  }

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
  $(`.${iconClass}`).remove();
};
