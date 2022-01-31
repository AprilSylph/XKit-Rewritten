import { keyToClasses, keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

let footerRedesignClasses;
let footerRedesignSelector;

const styleElement = buildStyle(`
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
`);

const removeFooterRedesign = elements => {
  elements.forEach(element => {
    element.dataset.oldClassName = element.className;
    element.classList.remove(...footerRedesignClasses);
  });
};

export const main = async function () {
  footerRedesignClasses = await keyToClasses('footerRedesign');
  footerRedesignSelector = await keyToCss('footerRedesign');
  pageModifications.register(footerRedesignSelector, removeFooterRedesign);
  document.head.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
  pageModifications.unregister(removeFooterRedesign);
  $('[data-old-class-name]')
    .attr('class', function () { return this.dataset.oldClassName; })
    .removeAttr('data-old-class-name');
};
