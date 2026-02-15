const preferenceSelector = 'checkbox-preference, color-preference, select-preference, text-preference, textarea-preference';

const checkForNoResults = function () {
  const nothingFound = [...document.querySelectorAll('xkit-feature')].every(featureElement =>
    featureElement.classList.contains('search-hidden') || featureElement.classList.contains('filter-hidden'),
  );

  document.querySelector('.no-results').style.display = nothingFound ? 'flex' : 'none';
};

$('nav a').on('click', event => {
  event.preventDefault();

  $('nav .selected').removeClass('selected');
  $(event.currentTarget).addClass('selected');

  $('section.open').removeClass('open');
  $(`section${event.currentTarget.getAttribute('href')}`).addClass('open');
});

document.getElementById('search').addEventListener('input', ({ currentTarget }) => {
  const query = currentTarget.value.toLowerCase();
  const featureElements = [...document.querySelectorAll('xkit-feature')];
  const preferenceElements = featureElements.flatMap(featureElement => [...featureElement.querySelectorAll(preferenceSelector)]);

  featureElements.forEach(featureElement => {
    const textContent = featureElement.textContent.toLowerCase();
    const shadowContent = featureElement.shadowRoot.textContent.toLowerCase();
    const relatedTerms = featureElement.dataset.relatedTerms.toLowerCase();
    const preferencesContent = [
      ...featureElement.querySelectorAll(preferenceSelector),
    ].map(({ shadowRoot }) => shadowRoot.textContent.toLowerCase()).join('\n');

    const hasMatch =
      textContent.includes(query) ||
      shadowContent.includes(query) ||
      relatedTerms.includes(query) ||
      preferencesContent.includes(query);

    featureElement.classList.toggle('search-hidden', !hasMatch);
  });

  preferenceElements.forEach(preferenceElement => {
    const hasMatch = query.length >= 3 && preferenceElement.shadowRoot.textContent.toLowerCase().includes(query);
    preferenceElement.classList.toggle('search-highlighted', hasMatch);
  });

  checkForNoResults();
});

document.getElementById('filter').addEventListener('input', event => {
  const featureElements = [...document.querySelectorAll('xkit-feature')];

  switch (event.currentTarget.value) {
    case 'all':
      $('.filter-hidden').removeClass('filter-hidden');
      break;
    case 'enabled':
      featureElements.forEach(featureElement => featureElement.classList.toggle('filter-hidden', featureElement.disabled));
      break;
    case 'disabled':
      featureElements.forEach(featureElement => featureElement.classList.toggle('filter-hidden', !featureElement.disabled));
      break;
  }

  const hiddenFeatures = [...document.querySelectorAll('xkit-feature.filter-hidden')];
  hiddenFeatures.forEach(({ shadowRoot }) => { shadowRoot.querySelector('details').open = false; });

  checkForNoResults();
});

const versionElement = document.getElementById('version');
versionElement.textContent = browser.runtime.getManifest().version;

const permissionsBannerElement = document.getElementById('permissions-banner');
const permissionsButton = document.getElementById('grant-host-permission');
const updatePermissionsBannerVisibility = hasHostPermission => {
  permissionsBannerElement.hidden = hasHostPermission;
};
permissionsButton.addEventListener('click', () => {
  browser.permissions
    .request({ origins: ['*://www.tumblr.com/*'] })
    .then(updatePermissionsBannerVisibility);
});
browser.permissions
  .contains({ origins: ['*://www.tumblr.com/*'] })
  .then(updatePermissionsBannerVisibility);

const params = new URLSearchParams(location.search);
const pageIsEmbedded = params.get('embedded') === 'true';
document.getElementById('embedded-banner').hidden = !pageIsEmbedded;
