import { keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';

const styleElement = buildStyle();

resolveExpressions`
article footer ${keyToCss('footerRow')} {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding-bottom: 12px;
}
article footer ${keyToCss('controls')} {
  justify-content: flex-end;
  padding: 0 var(--post-padding) 0 0;
  margin: 0 0 0 auto;
  border: none;
}
article footer ${keyToCss('controlIcon')}, .xkit-control-button-container {
  margin-left: 20px;
}
article footer ${keyToCss('noteCount')} {
  align-items: center;
  gap: var(--post-padding);
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

export const main = async () => document.head.append(styleElement);
export const clean = async () => styleElement.remove();
