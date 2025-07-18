const checkForNoResults = function () {
  const nothingFound =
    [...document.querySelectorAll('details.feature')]
      .every(detailsElement => detailsElement.classList.contains('search-hidden') || detailsElement.classList.contains('filter-hidden'));

  document.querySelector('.no-results').style.display = nothingFound ? 'flex' : 'none';
};

$('nav a').on('click', event => {
  event.preventDefault();
  $('nav .selected').removeClass('selected');
  $(event.currentTarget).addClass('selected');
  $('section.open').removeClass('open');
  $(`section${event.currentTarget.getAttribute('href')}`).addClass('open');
});

document.getElementById('search').addEventListener('input', event => {
  const query = event.currentTarget.value.toLowerCase();

  [...document.querySelectorAll('details.feature')]
    .forEach(detailsElement => {
      if (
        detailsElement.textContent.toLowerCase().includes(query) ||
        detailsElement.dataset.relatedTerms.toLowerCase().includes(query)
      ) {
        detailsElement.classList.remove('search-hidden');
      } else {
        detailsElement.classList.add('search-hidden');
      }
    });

  [...document.querySelectorAll('details.feature li')]
    .forEach(preferenceElement => {
      if (
        query.length >= 3 && preferenceElement.textContent.toLowerCase().includes(query)
      ) {
        preferenceElement.classList.add('search-highlighted');
      } else {
        preferenceElement.classList.remove('search-highlighted');
      }
    });

  checkForNoResults();
});

document.getElementById('filter').addEventListener('input', event => {
  switch (event.currentTarget.value) {
    case 'all':
      $('.feature.filter-hidden').removeClass('filter-hidden');
      break;
    case 'enabled':
      $('.feature.disabled').addClass('filter-hidden');
      $('.feature:not(.disabled)').removeClass('filter-hidden');
      break;
    case 'disabled':
      $('.feature:not(.disabled)').addClass('filter-hidden');
      $('.feature.disabled').removeClass('filter-hidden');
      break;
  }

  $('.feature[open].filter-hidden').removeAttr('open');

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
