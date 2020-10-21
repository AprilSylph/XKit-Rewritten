(function () {
  let css;

  const main = async function () {
    const { descendantSelector } = await fakeImport('/util/css_map.js');
    const { addStyle } = await fakeImport('/util/interface.js');

    const selector = await descendantSelector('wrapper', 'newPostIndicator');
    css = `${selector} { display: none; }`;
    addStyle(css);
  };

  const clean = async function () {
    const { removeStyle } = await fakeImport('/util/interface.js');
    removeStyle(css);
  };

  return { main, clean };
})();
