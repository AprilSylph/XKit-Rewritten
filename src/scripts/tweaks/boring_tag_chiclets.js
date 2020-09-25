(function () {
  let css;

  const main = async function () {
    const { keyToCss } = await fakeImport('/src/util/css_map.js');
    const { addStyle } = await fakeImport('/src/util/interface.js');

    const tagChicletWrapperSelector = await keyToCss('tagChicletWrapper');
    css = `${tagChicletWrapperSelector} { background-image: none !important; background-color: var(--secondary-accent); }`;

    addStyle(css);
  };

  const clean = async function () {
    const { removeStyle } = await fakeImport('/src/util/interface.js');
    removeStyle(css);
  };

  return { main, clean };
})();
