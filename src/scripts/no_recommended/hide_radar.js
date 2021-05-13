const excludeClass = 'xkit-no-recommended-radar-done';
const hiddenClass = 'xkit-no-recommended-radar-hidden';

let radarLabel;

const css = `.${hiddenClass} { display: none; }`;

const checkForRadar = function () {
  [...document.querySelectorAll(`aside > div > h1:not(.${excludeClass})`)]
    .filter(h1 => {
      h1.classList.add(excludeClass);
      return h1.textContent === radarLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));
};

export const main = async function () {
  const { onBaseContainerMutated } = await import('../../util/mutations.js');
  const { translate } = await import('../../util/language_data.js');
  const { addStyle } = await import('../../util/interface.js');

  radarLabel = await translate('Radar');
  onBaseContainerMutated.addListener(checkForRadar);
  checkForRadar();
  addStyle(css);
};

export const clean = async function () {
  const { onBaseContainerMutated } = await import('../../util/mutations.js');
  const { removeStyle } = await import('../../util/interface.js');

  onBaseContainerMutated.removeListener(checkForRadar);
  removeStyle(css);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
