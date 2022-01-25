import { keyToClasses, keyToCss } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';

let footerRedesignClasses;
let footerRedesignSelector;

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
};

export const clean = async function () {
  pageModifications.unregister(removeFooterRedesign);
  $('[data-old-class-name]')
    .attr('class', function () { return this.dataset.oldClassName; })
    .removeAttr('data-old-class-name');
};
