import { getPreferences } from '../util/preferences.js';
import { pageModifications } from '../util/mutations.js';

const excludeClass = 'xkit-classic-search-done';
const cloneClass = 'classic-search';

let newTab;

const swapNodes = (first, second) => {
  const temporary = document.createElement('div');
  first.replaceWith(temporary);
  second.replaceWith(first);
  temporary.replaceWith(second);
};

const replaceSearchForm = function ([searchFormElement]) {
  const searchFormElementClone = searchFormElement.cloneNode(true);

  searchFormElement.classList.add(excludeClass);
  searchFormElementClone.classList.add(cloneClass);

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

  const inputElement = searchFormElement.querySelector('input');
  const cloneInputElement = searchFormElementClone.querySelector('input');
  swapNodes(inputElement, cloneInputElement);

  searchFormElement.parentNode.prepend(searchFormElementClone);
};

export const main = async function () {
  ({ newTab } = await getPreferences('classic_search'));

  pageModifications.register(`form[role="search"][action="/search"]:not(.${cloneClass}):not(.${excludeClass})`, replaceSearchForm);
};

export const clean = async function () {
  pageModifications.unregister(replaceSearchForm);

  const searchFormElement = document.querySelector(`.${excludeClass}`);
  const searchFormElementClone = document.querySelector(`.${cloneClass}`);

  if (searchFormElement && searchFormElementClone) {
    const inputElement = searchFormElement.querySelector('input');
    const cloneInputElement = searchFormElementClone.querySelector('input');
    swapNodes(inputElement, cloneInputElement);
  }

  searchFormElementClone?.remove();
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const stylesheet = true;
