(function() {
  let recommendedBlogsLabel;

  const css = '.xkit-tweaks-recblogs-hidden { display: none; }';

  const checkForRecommendedBlogs = function() {
    [...document.querySelectorAll('aside > div > h1:not(.xkit-tweaks-recblogs-processed)')]
    .filter(h1 => {
      h1.classList.add('xkit-tweaks-recblogs-processed');
      return h1.textContent === recommendedBlogsLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add('xkit-tweaks-recblogs-hidden'));
  };

  const main = async function() {
    const { baseContainerListener } = await fakeImport('/src/util/mutations.js');
    const { translate } = await fakeImport('/src/util/language-data.js');
    const { addStyle } = await fakeImport('/src/util/misc.js');

    recommendedBlogsLabel = await translate('Recommended Blogs');
    baseContainerListener.addListener(checkForRecommendedBlogs);
    checkForRecommendedBlogs();
    addStyle(css);
  };

  const clean = async function() {
    const { baseContainerListener } = await fakeImport('/src/util/mutations.js');
    const { removeStyle } = await fakeImport('/src/util/misc.js');

    baseContainerListener.removeListener(checkForRecommendedBlogs);
    removeStyle(css);
    $('.xkit-tweaks-recblogs-processed').removeClass('xkit-tweaks-recblogs-processed');
    $('.xkit-tweaks-recblogs-hidden').removeClass('xkit-tweaks-recblogs-hidden');
  };

  return { main, clean };
})();
