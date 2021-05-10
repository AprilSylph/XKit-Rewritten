let newTab;

let searchInputElement;
let searchInputParent;

const replaceSearchForm = function () {
  const searchFormElement = document.querySelector('form[role="search"][action="//www.tumblr.com/search"]:not(.classic-search):not(.xkit-classic-search-done)');

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

  const eventlessInput = searchFormElementClone.querySelector('input');
  const eventlessInputParent = eventlessInput.parentNode;
  eventlessInputParent.removeChild(eventlessInput);
  eventlessInputParent.appendChild(searchInputElement);

  searchFormElementClone.classList.add('classic-search');

  searchFormElement.parentNode.prepend(searchFormElementClone);
};

export const main = async function () {
  const { getPreferences } = await import('../util/preferences.js');
  const { onBaseContainerMutated } = await import('../util/mutations.js');

  ({ newTab } = await getPreferences('classic_search'));

  onBaseContainerMutated.addListener(replaceSearchForm);
  replaceSearchForm();
};

export const clean = async function () {
  const { onBaseContainerMutated } = await import('../util/mutations.js');
  onBaseContainerMutated.removeListener(replaceSearchForm);

  searchInputParent.appendChild(searchInputElement);
  $('.classic-search').remove();
  $('.xkit-classic-search-done').removeClass('xkit-classic-search-done');
};

export const stylesheet = true;
export const autoRestart = true;
