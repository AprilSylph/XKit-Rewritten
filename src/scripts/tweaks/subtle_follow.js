(function() {
  let css;

  const main = async function() {
    const { descendantSelector } = await fakeImport('/src/util/css_map.js');
    const { addStyle } = await fakeImport('/src/util/interface.js');

    const selector = await descendantSelector('post', 'followButton');
    css = `${selector} { color: var(--gray-40); }`;
    addStyle(css);
  };

  const clean = async function() {
    const { removeStyle } = await fakeImport('/src/util/interface.js');
    removeStyle(css);
  };

  return { main, clean };
})();
