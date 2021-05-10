const css = '[data-is-contributed-content="true"] { border-bottom: 1px solid transparent; background-color: rgb(var(--follow)); }';

export const main = async function () {
  const { addStyle } = await fakeImport('/util/interface.js');
  addStyle(css);
};

export const clean = async function () {
  const { removeStyle } = await fakeImport('/util/interface.js');
  removeStyle(css);
};
