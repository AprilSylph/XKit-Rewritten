import { getPreferences } from '../util/preferences.js';
import { pageModifications } from '../util/mutations.js';

const excludeClass = 'xkit-classic-search-done';
const cloneClass = 'classic-search';
const placeholderInputId = 'classic-search-placeholder';

let newTab;

const replaceSearchForm = function ([searchFormElement]) {
  searchFormElement.classList.add(`${excludeClass}`);

  const searchFormElementClone = searchFormElement.cloneNode(true);
  searchFormElementClone.addEventListener('submit', event => {
    event.preventDefault();

    const query = event.target.querySelector('input').value;
    const address = `//www.tumblr.com/tagged/${query}?sort=recent`;

    if (newTab) {
      window.open(address);
    } else {
      location.assign(address);
    }
  });
  searchFormElementClone.classList.add(cloneClass);

  const realInputElement = searchFormElement.querySelector('input');
  const cloneInputElement = searchFormElementClone.querySelector('input');
  const placeholderElement = Object.assign(document.createElement('div'), { id: placeholderInputId });

  realInputElement.replaceWith(placeholderElement);
  cloneInputElement.replaceWith(realInputElement);

  searchFormElement.parentNode.prepend(searchFormElementClone);
};

export const main = async function () {
  ({ newTab } = await getPreferences('classic_search'));

  pageModifications.register(`form[role="search"][action="/search"]:not(.${cloneClass}):not(.${excludeClass})`, replaceSearchForm);
};

export const clean = async function () {
  pageModifications.unregister(replaceSearchForm);

  const searchFormElementClone = document.querySelector(`.${cloneClass}`);
  const realInputElement = searchFormElementClone?.querySelector('input');
  const placeholderElement = document.getElementById(placeholderInputId);

  placeholderElement?.replaceWith(realInputElement);

  searchFormElementClone?.remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
