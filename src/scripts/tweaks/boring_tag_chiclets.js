(function () {
  let css;

  const main = async function () {
    const { keyToCss } = await fakeImport('/util/css_map.js');
    const { addStyle } = await fakeImport('/util/interface.js');

    const tagChicletWrapperSelector = await keyToCss('tagChicletWrapper');
    css = `${tagChicletWrapperSelector} { background-image: none !important; color: var(--black); background-color: var(--secondary-accent); }`;

    addStyle(css);
  };

  const clean = async function () {
    const { removeStyle } = await fakeImport('/util/interface.js');
    removeStyle(css);
  };

  return { main, clean };
})();
