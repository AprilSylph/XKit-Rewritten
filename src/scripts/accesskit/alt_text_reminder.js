import { keyToCss } from '../../util/css_map.js';
import { buildStyle } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';

const styleElement = buildStyle(`
  figure[data-no-alt-text] ${keyToCss('optionsIcon')} {
    outline: 3px dashed rgb(var(--accent));
    outline-offset: -1px;
  }

  figure[data-no-alt-text]:hover ${keyToCss('images')} > div::after {
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

  figure[data-no-alt-text] ${keyToCss('optionsWrapper')} {
    display: unset !important;
  }
`);

const processEditors = editors =>
  editors.forEach(editor => {
    const observerCallback = () => {
      [...editor.querySelectorAll('figure[data-no-alt-text]')].forEach(element => {
        delete element.dataset.noAltText;
      });

      const imagesWithoutAlt = [
        ...editor.querySelectorAll(`figure img[alt="${translate('Image')}"]`)
      ];

      imagesWithoutAlt.forEach(image => {
        image.closest('figure').dataset.noAltText = true;
      });
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(editor, {
      subtree: true,
      childList: true,
      attributeFilter: ['alt']
    });
  });

export const main = async () => {
  document.documentElement.append(styleElement);
  pageModifications.register(keyToCss('editor'), processEditors);
};

export const clean = async () => {
  styleElement.remove();
  [...document.querySelectorAll('figure[data-no-alt-text]')].forEach(element => {
    delete element.dataset.noAltText;
  });
};
