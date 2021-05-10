let css;

export const main = async function () {
  const { keyToCss } = await import('../../util/css_map.js');
  const { addStyle } = await import('../../util/interface.js');

  const tagChicletWrapperSelector = await keyToCss('tagChicletWrapper');
  css = `${tagChicletWrapperSelector} { background-image: none !important; color: rgb(var(--black)); background-color: rgb(var(--secondary-accent)); }`;

  addStyle(css);
};

export const clean = async function () {
  const { removeStyle } = await import('../../util/interface.js');
  removeStyle(css);
};
