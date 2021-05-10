const excludeClass = 'xkit-tweaks-recblogs-done';
const hiddenClass = 'xkit-tweaks-recblogs-hidden';

let recommendedBlogsLabel;

const css = `.${hiddenClass} { display: none; }`;

const checkForRecommendedBlogs = function () {
  [...document.querySelectorAll(`aside > div > h1:not(.${excludeClass})`)]
    .filter(h1 => {
      h1.classList.add(excludeClass);
      return h1.textContent === recommendedBlogsLabel;
    })
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));
};

export const main = async function () {
  const { onBaseContainerMutated } = await fakeImport('/util/mutations.js');
  const { translate } = await fakeImport('/util/language_data.js');
  const { addStyle } = await fakeImport('/util/interface.js');

  recommendedBlogsLabel = await translate('Check out these blogs');
  onBaseContainerMutated.addListener(checkForRecommendedBlogs);
  checkForRecommendedBlogs();
  addStyle(css);
};

export const clean = async function () {
  const { onBaseContainerMutated } = await fakeImport('/util/mutations.js');
  const { removeStyle } = await fakeImport('/util/interface.js');

  onBaseContainerMutated.removeListener(checkForRecommendedBlogs);
  removeStyle(css);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
