import { keyToCss } from '../../utils/css_map.js';
import { onClickNavigate } from '../../utils/tumblr_helpers.js';
import { pageModifications } from '../../utils/mutations.js';

const modifiedAttribute = 'data-xkit-tweaks-create-button-no-bubbles';

const processCreateButtons = (createButtons) => {
  if (window.matchMedia('not (min-width: 990px)').matches) {
    return; // No action needed on mobile/tablet layouts
  }

  createButtons.forEach(createButton => {
    createButton.dataset.href = createButton.getAttribute('href');

    createButton.setAttribute(modifiedAttribute, '');
    createButton.setAttribute('href', '/new/text');
    createButton.addEventListener('click', onClickNavigate);
  });
};

export const main = async function () {
  pageModifications.register(keyToCss('createPostButton'), processCreateButtons);
};

export const clean = async function () {
  pageModifications.unregister(processCreateButtons);

  [...document.querySelectorAll(`[${modifiedAttribute}]`)].forEach(modifiedButton => {
    modifiedButton.removeAttribute(modifiedAttribute);
    modifiedButton.setAttribute('href', modifiedButton.dataset.href);
    modifiedButton.removeEventListener('click', onClickNavigate);
  });
};
