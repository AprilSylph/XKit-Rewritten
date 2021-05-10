let css;

export const main = async function () {
  const { descendantSelector } = await import('../../util/css_map.js');
  const { addStyle } = await import('../../util/interface.js');

  const quoteSelector = await descendantSelector('textBlock', 'quote');
  const chatSelector = await descendantSelector('textBlock', 'chat');
  const quirkySelector = await descendantSelector('textBlock', 'quirky');

  css = `${quoteSelector}, ${chatSelector}, ${quirkySelector} { font-family: var(--font-family); }`;
  addStyle(css);
};

export const clean = async function () {
  const { removeStyle } = await import('../../util/interface.js');
  removeStyle(css);
};
