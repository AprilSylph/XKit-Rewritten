let css;

export const main = async function () {
  const { descendantSelector } = await import('../../util/css_map.js');
  const { addStyle } = await import('../../util/interface.js');

  const selector = await descendantSelector('post', 'followButton');
  css = `${selector} { color: rgba(var(--black), 0.4); }`;
  addStyle(css);
};

export const clean = async function () {
  const { removeStyle } = await import('../../util/interface.js');
  removeStyle(css);
};
