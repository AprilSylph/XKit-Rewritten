import { keyToClasses, keyToCss } from '../../util/css_map.js';
import { onBaseContainerMutated } from '../../util/mutations.js';

let footerRedesignClasses;
let footerRedesignSelector;

const removeFooterRedesign = () => {
  [...document.querySelectorAll(footerRedesignSelector)].forEach(element => {
    element.dataset.oldClassName = element.className;
    element.classList.remove(...footerRedesignClasses);
  });
};

export const main = async function () {
  footerRedesignClasses = await keyToClasses('footerRedesign');
  footerRedesignSelector = await keyToCss('footerRedesign');
  onBaseContainerMutated.addListener(removeFooterRedesign);
  removeFooterRedesign();
};

export const clean = async function () {
  onBaseContainerMutated.removeListener(removeFooterRedesign);
  $('[data-old-class-name]')
    .attr('class', function () { return this.attr('data-old-class-name'); })
    .removeAttr('data-old-class-name');
};
