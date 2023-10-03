const checkForNoResults = function () {
  const nothingFound =
    [...document.querySelectorAll('details.script')]
      .every(detailsElement => detailsElement.classList.contains('search-hidden') || detailsElement.classList.contains('filter-hidden'));

  // @ts-ignore
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
  // @ts-ignore
  const query = event.currentTarget.value.toLowerCase();

  [...document.querySelectorAll('details.script')]
    .forEach(detailsElement => {
      if (
        detailsElement.textContent.toLowerCase().includes(query) ||
        // @ts-ignore
        detailsElement.dataset.relatedTerms.toLowerCase().includes(query)
      ) {
        detailsElement.classList.remove('search-hidden');
      } else {
        detailsElement.classList.add('search-hidden');
      }
    });

  checkForNoResults();
});

document.getElementById('filter').addEventListener('input', event => {
  // @ts-ignore
  switch (event.currentTarget.value) {
    case 'all':
      $('.script.filter-hidden').removeClass('filter-hidden');
      break;
    case 'enabled':
      $('.script.disabled').addClass('filter-hidden');
      $('.script:not(.disabled)').removeClass('filter-hidden');
      break;
    case 'disabled':
      $('.script:not(.disabled)').addClass('filter-hidden');
      $('.script.disabled').removeClass('filter-hidden');
      break;
  }

  $('.script[open].filter-hidden').removeAttr('open');

  checkForNoResults();
});

const versionElement = document.getElementById('version');
versionElement.textContent = browser.runtime.getManifest().version;

const params = new URLSearchParams(location.search);
const pageIsEmbedded = params.get('embedded') === 'true';
document.getElementById('embedded-banner').hidden = !pageIsEmbedded;
