(function() {
  let radarLabel;

  const css = '.xkit-tweaks-radar-hidden { display: none; }';

  const checkForRadar = function() {
    [...document.querySelectorAll('aside > div > h1:not(.xkit-tweaks-radar-processed)')]
    .filter(h1 => {
      h1.classList.add('xkit-tweaks-radar-processed');
      return h1.textContent === radarLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add('xkit-tweaks-radar-hidden'));
  };

  const run = async function() {
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');
    const { translate } = await fakeImport('/src/util/language-data.js');
    const { addStyle } = await fakeImport('/src/util/misc.js');

    radarLabel = await translate('Radar');
    onBaseContainerMutated.addListener(checkForRadar);
    checkForRadar();
    addStyle(css);
  };

  const destroy = async function() {
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');
    const { removeStyle } = await fakeImport('/src/util/misc.js');

    onBaseContainerMutated.removeListener(checkForRadar);
    removeStyle(css);
    $('.xkit-tweaks-radar-processed').removeClass('xkit-tweaks-radar-processed');
    $('.xkit-tweaks-radar-hidden').removeClass('xkit-tweaks-radar-hidden');
  };

  return { run, destroy };
})();
