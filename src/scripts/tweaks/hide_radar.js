(function () {
  let radarLabel;

  const css = '.xkit-tweaks-radar-hidden { display: none; }';

  const checkForRadar = function () {
    [...document.querySelectorAll('aside > div > h1:not(.xkit-tweaks-radar-done)')]
    .filter(h1 => {
      h1.classList.add('xkit-tweaks-radar-done');
      return h1.textContent === radarLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add('xkit-tweaks-radar-hidden'));
  };

  const main = async function () {
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');
    const { translate } = await fakeImport('/src/util/language_data.js');
    const { addStyle } = await fakeImport('/src/util/interface.js');

    radarLabel = await translate('Radar');
    onBaseContainerMutated.addListener(checkForRadar);
    checkForRadar();
    addStyle(css);
  };

  const clean = async function () {
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');
    const { removeStyle } = await fakeImport('/src/util/interface.js');

    onBaseContainerMutated.removeListener(checkForRadar);
    removeStyle(css);
    $('.xkit-tweaks-radar-done').removeClass('xkit-tweaks-radar-done');
    $('.xkit-tweaks-radar-hidden').removeClass('xkit-tweaks-radar-hidden');
  };

  return { main, clean };
})();
