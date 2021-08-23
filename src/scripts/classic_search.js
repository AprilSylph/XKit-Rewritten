import { getPreferences } from '../util/preferences.js';
import { onBaseContainerMutated } from '../util/mutations.js';

let newTab;

let searchInputElement;
let searchInputParent;

const replaceSearchForm = function () {
  const searchFormElement = document.querySelector('form[role="search"][action="/search"]:not(.classic-search):not(.xkit-classic-search-done)');

  if (!searchFormElement) {
    return;
  }

  searchFormElement.classList.add('xkit-classic-search-done');

  searchInputElement = searchFormElement.querySelector('input');
  searchInputParent = searchInputElement.parentNode;

  const searchFormElementClone = searchFormElement.cloneNode(true);
  searchFormElementClone.addEventListener('submit', event => {
    event.preventDefault();

    const query = event.target.querySelector('input').value;
    const address = `//www.tumblr.com/tagged/${query}`;

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

  onBaseContainerMutated.addListener(replaceSearchForm);
  replaceSearchForm();
};

export const clean = async function () {
  onBaseContainerMutated.removeListener(replaceSearchForm);

  searchInputParent.appendChild(searchInputElement);
  $('.classic-search').remove();
  $('.xkit-classic-search-done').removeClass('xkit-classic-search-done');
};

export const stylesheet = true;
