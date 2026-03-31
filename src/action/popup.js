const preferenceSelector = 'checkbox-preference, color-preference, select-preference, text-preference, textarea-preference';

const checkForNoResults = function () {
  /** @type {HTMLElement[]} */ const featureElements = [...document.querySelectorAll('xkit-feature')];

  const visibleFeatureElements = featureElements.filter(featureElement => featureElement.matches('.search-hidden, .filter-hidden') === false);
  visibleFeatureElements.forEach((featureElement, index) => featureElement.classList.toggle('search-first', index === 0));
  visibleFeatureElements.forEach((featureElement, index, array) => featureElement.classList.toggle('search-last', index === (array.length - 1)));

  const nothingFound = visibleFeatureElements.length === 0;
  document.querySelector('.no-results').style.display = nothingFound ? 'flex' : '';
  document.querySelector('.features').style.display = nothingFound ? 'none' : '';
};

document.querySelector('[role="tablist"]').addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
  if (event.target.getAttribute('role') !== 'tab') return;

  switch (event.key) {
    case 'ArrowLeft':
      event.target.previousElementSibling?.focus();
      event.target.previousElementSibling?.click();
      break;
    case 'ArrowRight':
      event.target.nextElementSibling?.focus();
      event.target.nextElementSibling?.click();
      break;
    default:
      return;
  }

  event.stopPropagation();
});

[...document.querySelectorAll('[role="tab"]')].forEach(tab =>
  tab.addEventListener('click', ({ currentTarget }) => {
    const targetPanelId = currentTarget.getAttribute('aria-controls');
    const tabList = currentTarget.closest('[role="tablist"]');
    const tabListChildren = Array.from(tabList.children);
    const tabListPanelIds = tabListChildren.map(tab => tab.getAttribute('aria-controls'));

    tabListChildren.forEach(tab => {
      tab.setAttribute('aria-selected', tab === currentTarget ? 'true' : 'false');
      tab.setAttribute('tabindex', tab === currentTarget ? '0' : '-1');
    });
    tabListPanelIds.forEach(panelId => document.getElementById(panelId)?.toggleAttribute('hidden', targetPanelId !== panelId));
  }),
);

document.getElementById('searchbox').addEventListener('input', ({ currentTarget }) => {
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
