import { keyToCss } from '../../utils/css_map.js';
import { buildStyle } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const missingAltTextBlock = 'figure:has(img:not([alt]), img[alt=""])';

const styleElement = buildStyle(`
  ${missingAltTextBlock} ${keyToCss('optionsIcon')} {
    outline: 3px dashed rgb(var(--deprecated-accent));
    outline-offset: -1px;
  }

  ${missingAltTextBlock}:hover ${keyToCss('images')} > div::after {
    position: absolute;
    bottom: 5px;
    right: 0px;

    padding: 23px 46px 23px 12px;
    border-radius: 23px;

    background-color: rgba(var(--black));
    color: rgb(var(--white));

    content: "Add a description! ->";
    font-size: var(--base-font-size);
    font-weight: 500;
    line-height: 0;
  }

  ${missingAltTextBlock} ${keyToCss('optionsWrapper')} {
    display: unset !important;
  }
`);

const processEditors = ([editor]) => editor.prepend(styleElement);

export const main = async () => {
  pageModifications.register('.block-editor-writing-flow', processEditors);
};

export const clean = async () => {
  pageModifications.unregister(processEditors);
  styleElement.remove();
};
