import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { navigate } from '../../utils/tumblr_helpers.js';

let newTab;

let searchInputElement;
let searchInputParent;

const replaceSearchForm = function ([searchFormElement]) {
  searchFormElement.classList.add('xkit-classic-search-done');

  searchInputElement = searchFormElement.querySelector('input');
  searchInputParent = searchInputElement.parentNode;

  const searchFormElementClone = searchFormElement.cloneNode(true);
  searchFormElementClone.addEventListener('submit', event => {
    event.preventDefault();

    const query = event.target.querySelector('input').value;
    const address = `//www.tumblr.com/tagged/${query}?sort=recent`;

    if (newTab) {
      window.open(address);
    } else {
      navigate(address);
    }
  });
  searchFormElementClone.classList.add('classic-search');
  searchFormElementClone.querySelector('input').replaceWith(searchInputElement);
  searchFormElement.parentNode.prepend(searchFormElementClone);
};

export const main = async function () {
  ({ newTab } = await getPreferences('classic_search'));

  pageModifications.register('form[role="search"][action="/search"]:not(.classic-search):not(.xkit-classic-search-done)', replaceSearchForm);
};

export const clean = async function () {
  pageModifications.unregister(replaceSearchForm);

  searchInputParent.appendChild(searchInputElement);
  $('.classic-search').remove();
  $('.xkit-classic-search-done').removeClass('xkit-classic-search-done');
};

export const stylesheet = true;
