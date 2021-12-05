import { onBaseContainerMutated } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { buildStyle } from '../../util/interface.js';

const excludeClass = 'xkit-no-recommended-radar-done';
const hiddenClass = 'xkit-no-recommended-radar-hidden';

let radarLabel;

const styleElement = buildStyle(`.${hiddenClass} { display: none; }`);

const checkForRadar = function () {
  [...document.querySelectorAll(`aside > div > h1:not(.${excludeClass})`)]
    .filter(h1 => {
      h1.classList.add(excludeClass);
      return h1.textContent === radarLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));
};

export const main = async function () {
  radarLabel = await translate('Radar');
  onBaseContainerMutated.addListener(checkForRadar);
  checkForRadar();
  document.head.append(styleElement);
};

export const clean = async function () {
  onBaseContainerMutated.removeListener(checkForRadar);
  styleElement.remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
