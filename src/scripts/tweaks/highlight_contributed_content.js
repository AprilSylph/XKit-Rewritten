(function () {
  const css = '[data-is-contributed-content="true"] { border-bottom: 1px solid transparent; background-color: rgb(var(--follow)); }';

  const main = async function () {
    const { addStyle } = await fakeImport('/util/interface.js');
    addStyle(css);
  };

  const clean = async function () {
    const { removeStyle } = await fakeImport('/util/interface.js');
    removeStyle(css);
  };

  return { main, clean };
})();
