(function() {
  let css;

  const run = async function() {
    const { descendantSelector } = await fakeImport('/src/util/css_map.js');
    const { addStyle } = await fakeImport('/src/util/misc.js');

    const selector = await descendantSelector('post', 'followButton');
    css = `${selector} { color: var(--gray-40); }`;
    addStyle(css);
  };

  const destroy = async function() {
    const { removeStyle } = await fakeImport('/src/util/misc.js');
    removeStyle(css);
  };

  return { run, destroy };
})();
