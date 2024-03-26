import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';

const missingAltTextBlock = `figure:has(img[alt="${translate('Image')}"], img[alt="${translate('Image').toLowerCase()}"])`;

const styleElement = buildStyle(`
  ${missingAltTextBlock} ${keyToCss('optionsIcon')} {
    outline: 3px dashed rgb(var(--accent));
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
