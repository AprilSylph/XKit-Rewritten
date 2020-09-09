(function() {
  let newTab;

  let searchInputElement;
  let searchInputParent;

  const replaceSearchForm = function() {
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

  const onStorageChanged = function(changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'classic_search.preferences.newTab': newTabChanges,
    } = changes;

    if (newTabChanges) {
      clean().then(main); // eslint-disable-line no-use-before-define
    }
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');

    ({newTab} = await getPreferences('classic_search'));

    onBaseContainerMutated.addListener(replaceSearchForm);
    replaceSearchForm();
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onBaseContainerMutated } = await fakeImport('/src/util/mutations.js');
    onBaseContainerMutated.removeListener(replaceSearchForm);

    searchInputParent.appendChild(searchInputElement);
    $('.classic-search').remove();
    $('.xkit-classic-search-done').removeClass('xkit-classic-search-done');
  };

  return { main, clean, stylesheet: true };
})();
