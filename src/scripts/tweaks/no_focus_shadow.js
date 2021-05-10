const cssTemplate = selector => `${selector} { box-shadow: none !important; }`;
let css;

export const main = async function () {
  const { keyToClasses } = await import('../../util/css_map.js');
  const { addStyle } = await import('../../util/interface.js');

  const listTimelineObjectClasses = await keyToClasses('listTimelineObject');
  const selector = listTimelineObjectClasses.map(className => `.${className}:focus > div`).join(',');
  css = cssTemplate(selector);

  addStyle(css);
};

export const clean = async function () {
  const { removeStyle } = await import('../../util/interface.js');
  removeStyle(css);
};
