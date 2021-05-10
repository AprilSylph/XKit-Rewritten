let css;

export const main = async function () {
  const { descendantSelector } = await fakeImport('/util/css_map.js');
  const { addStyle } = await fakeImport('/util/interface.js');

  const selector = await descendantSelector('post', 'followButton');
  css = `${selector} { color: rgba(var(--black), 0.4); }`;
  addStyle(css);
};

export const clean = async function () {
  const { removeStyle } = await fakeImport('/util/interface.js');
  removeStyle(css);
};
