(function () {
  let recommendedBlogsLabel;

  const css = '.xkit-tweaks-recblogs-hidden { display: none; }';

  const checkForRecommendedBlogs = function () {
    [...document.querySelectorAll('aside > div > h1:not(.xkit-tweaks-recblogs-done)')]
    .filter(h1 => {
      h1.classList.add('xkit-tweaks-recblogs-done');
      return h1.textContent === recommendedBlogsLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add('xkit-tweaks-recblogs-hidden'));
  };

  const main = async function () {
    const { onBaseContainerMutated } = await fakeImport('/util/mutations.js');
    const { translate } = await fakeImport('/util/language_data.js');
    const { addStyle } = await fakeImport('/util/interface.js');

    recommendedBlogsLabel = await translate('Recommended Blogs');
    onBaseContainerMutated.addListener(checkForRecommendedBlogs);
    checkForRecommendedBlogs();
    addStyle(css);
  };

  const clean = async function () {
    const { onBaseContainerMutated } = await fakeImport('/util/mutations.js');
    const { removeStyle } = await fakeImport('/util/interface.js');

    onBaseContainerMutated.removeListener(checkForRecommendedBlogs);
    removeStyle(css);
    $('.xkit-tweaks-recblogs-done').removeClass('xkit-tweaks-recblogs-done');
    $('.xkit-tweaks-recblogs-hidden').removeClass('xkit-tweaks-recblogs-hidden');
  };

  return { main, clean };
})();
