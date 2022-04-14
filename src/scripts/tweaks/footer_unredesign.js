import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const removePaddingClass = 'xkit-footer-padding-fix';

const styleElement = buildStyle();

resolveExpressions`
.${removePaddingClass} {
  padding-bottom: 0;
}

article footer > ${keyToCss('noteCount')} {
  align-items: center;
  gap: var(--post-padding);
}

article footer > ${keyToCss('controls')} {
  margin-left: auto;
}

.xkit-control-button-container {
  margin-left: 20px;
}

[role="dialog"] #quick-reblog,
[role="dialog"] #quick-tags {
  top: 50% !important;
  bottom: unset !important;
  right: 100% !important;
  transform: translate(-20px, -50%) !important;
}

@media only screen and (max-width: 650px) {
  #quick-reblog,
  #quick-tags {
    top: 50% !important;
    bottom: unset !important;
    right: 100% !important;
    transform: translate(-20px, -50%) !important;
  }
}
`.then(css => { styleElement.textContent = css; });

export const main = async function () {
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
  $(`.${removePaddingClass}`).removeClass(removePaddingClass);
};
