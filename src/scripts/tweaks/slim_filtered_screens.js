import { keyToClasses } from '../../util/css_map.js';
import { addStyle, removeStyle } from '../../util/interface.js';

let css;

const cssTemplate = filteredScreen => `
  [data-id] .${filteredScreen} {
    flex-direction: row;
    justify-content: space-between;
    overflow-x: auto;
    height: auto;
    padding-top: var(--post-header-vertical-padding);
    padding-bottom: var(--post-header-vertical-padding);
  }

  [data-id] .${filteredScreen} > p {
      flex-shrink: 0;
  }

  [data-id] .${filteredScreen} > a {
      overflow: hidden;
      margin-right: auto;
      margin-left: 1ch;

      text-overflow: ellipsis;
      white-space: nowrap;
  }

  [data-id] .${filteredScreen} > button {
      flex-shrink: 0;
      margin-left: 1ch;
  }

  [data-id] .${filteredScreen} > button > span {
      margin-top: 0;
  }
`;

export const main = async function () {
  const [filteredScreen] = await keyToClasses('filteredScreen');
  css = cssTemplate(filteredScreen);
  addStyle(css);
};

export const clean = async function () {
  removeStyle(css);
};
