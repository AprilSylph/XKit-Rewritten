import { getPreferences } from '../util/preferences.js';
import { pageModifications } from '../util/mutations.js';
import { remove, removeClass } from '../util/cleanup.js';

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
      location.assign(address);
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
  remove('classic-search');
  removeClass('xkit-classic-search-done');
};

export const stylesheet = true;
