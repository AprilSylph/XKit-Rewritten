import { keyToClasses, keyToCss, resolveExpressions } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';

const removePaddingClass = 'xkit-footer-padding-fix';

let footerRedesignClasses;
let footerRedesignSelector;
let postActivityWrapperSelector;

const styleElement = buildStyle();

resolveExpressions`
.${removePaddingClass} {
  padding-bottom: 0;
}

article footer button[aria-label="${translate('Tip')}"] {
  margin-left: var(--post-padding);
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

const removeFooterRedesign = elements => {
  elements.forEach(element => {
    element.dataset.oldClassName = element.className;
    element.classList.remove(...footerRedesignClasses);
    if (element.querySelector(postActivityWrapperSelector)) {
      element.classList.add(removePaddingClass);
    }
  });
};

export const main = async function () {
  footerRedesignClasses = await keyToClasses('footerRedesign');
  footerRedesignSelector = await keyToCss('footerRedesign');
  postActivityWrapperSelector = await keyToCss('postActivityWrapper');
  pageModifications.register(footerRedesignSelector, removeFooterRedesign);
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
  pageModifications.unregister(removeFooterRedesign);
  $('[data-old-class-name]')
    .attr('class', function () { return this.dataset.oldClassName; })
    .removeAttr('data-old-class-name');
  $(`.${removePaddingClass}`).removeClass(removePaddingClass);
};
