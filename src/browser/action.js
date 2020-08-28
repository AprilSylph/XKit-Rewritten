const {getURL} = browser.runtime;

const getInstalledScripts = async function() {
  const url = getURL('/src/scripts/_index.json');
  const file = await fetch(url);
  const installedScripts = await file.json();

  return installedScripts;
};

const writeEnabled = async function(event) {
  const {checked, id} = event.target;
  const {parentNode: {parentNode: {parentNode: detailsElement}}} = event.target;
  let {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

  if (checked) {
    enabledScripts.push(id);
    detailsElement.classList.remove('disabled');
  } else {
    enabledScripts = enabledScripts.filter(x => x !== id);
    detailsElement.classList.add('disabled');
  }

  browser.storage.local.set({enabledScripts});
};

const writePreference = async function(event) {
  const {id, tagName, type} = event.target;
  const [scriptName, preferenceName] = id.split('.');
  const storageKey = `${scriptName}.preferences`;
  const {[storageKey]: savedPreferences = {}} = await browser.storage.local.get(storageKey);

  if (tagName === 'INPUT') {
    switch (type) {
      case 'checkbox':
        savedPreferences[preferenceName] = event.target.checked;
        break;
      case 'text':
        savedPreferences[preferenceName] = event.target.value;
        break;
    }
  } else if (tagName === 'SELECT') {
    savedPreferences[preferenceName] = event.target.value;
  }

  browser.storage.local.set({[storageKey]: savedPreferences});
};

const renderScripts = async function() {
  const configSection = document.getElementById('configuration');
  const installedScripts = await getInstalledScripts();
  const {enabledScripts = []} = await browser.storage.local.get('enabledScripts');

  for (const name of installedScripts) {
    const url = getURL(`/src/scripts/${name}.json`);
    const file = await fetch(url);
    const {title = name, description = '', icon = {}, preferences = {}} = await file.json();

    const scriptTemplateClone = document.getElementById('script').content.cloneNode(true);

    if (enabledScripts.includes(name) === false) {
      const detailsElement = scriptTemplateClone.querySelector('details.script');
      detailsElement.classList.add('disabled');
    }

    if (icon.class_name !== undefined) {
      const iconDiv = scriptTemplateClone.querySelector('div.icon');
      iconDiv.style.backgroundColor = icon.background_color || '#ffffff';

      const iconInner = iconDiv.querySelector('i');
      iconInner.classList.add(icon.class_name);
      iconInner.style.color = icon.color || '#000000';
    }

    const titleHeading = scriptTemplateClone.querySelector('h4.title');
    titleHeading.textContent = title;

    if (description !== '') {
      const descriptionParagraph = scriptTemplateClone.querySelector('p.description');
      descriptionParagraph.textContent = description;
    }

    const unorderedList = scriptTemplateClone.querySelector('ul');

    const enabledInput = unorderedList.querySelector('input');
    enabledInput.id = name;
    enabledInput.checked = enabledScripts.includes(name);
    enabledInput.addEventListener('input', writeEnabled);

    const enabledLabel = unorderedList.querySelector('label');
    enabledLabel.setAttribute('for', name);

    const storageKey = `${name}.preferences`;
    const {[storageKey]: savedPreferences = {}} = await browser.storage.local.get(storageKey);

    for (const [key, preference] of Object.entries(preferences)) {
      const savedPreference = savedPreferences[key] === undefined ? preference.default : savedPreferences[key];
      const preferenceTemplateClone = document.getElementById(`${preference.type}-preference`).content.cloneNode(true);

      const preferenceLabel = preferenceTemplateClone.querySelector('label');
      preferenceLabel.textContent = preference.label;
      preferenceLabel.setAttribute('for', `${name}.${key}`);

      const inputType = {
        checkbox: 'input',
        text: 'input',
        color: 'input',
        select: 'select',
      }[preference.type];

      const preferenceInput = preferenceTemplateClone.querySelector(inputType);
      preferenceInput.id = `${name}.${key}`;
      preferenceInput.addEventListener('input', writePreference);

      switch (preference.type) {
        case 'checkbox':
          preferenceInput.checked = savedPreference;
          break;
        case 'text':
        case 'color':
          preferenceInput.value = savedPreference;
          break;
        case 'select':
          for (const [value, text] of Object.entries(preference.options)) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            option.selected = value === savedPreference;
            preferenceInput.appendChild(option);
          }
          break;
      }

      unorderedList.appendChild(preferenceTemplateClone);
    }

    configSection.appendChild(scriptTemplateClone);
  }

  const $makeSpectrum = $(configSection).find('.makeSpectrum');

  $makeSpectrum.spectrum({
    preferredFormat: 'hex',
    showInput: true,
    showInitial: true,
    allowEmpty: true,
  });
  $makeSpectrum.on('change.spectrum', writePreference);
};

const checkForNoResults = function() {
  const nothingFound =
    [...document.querySelectorAll('details.script')]
    .every(detailsElement => detailsElement.classList.contains('search-hidden') || detailsElement.classList.contains('filter-hidden'));

  document.querySelector('.no-results').style.display = nothingFound ? 'flex' : 'none';
};

$('nav a').click(event => {
  event.preventDefault();
  $('nav .selected').removeClass('selected');
  $(event.target).addClass('selected');
  $('section.open').removeClass('open');
  $(`section${event.target.getAttribute('href')}`).addClass('open');
});

document.getElementById('search').addEventListener('input', event => {
  const query = event.target.value.toLowerCase();

  [...document.querySelectorAll('details.script')]
  .forEach(detailsElement => {
    if (detailsElement.textContent.toLowerCase().includes(query)) {
      detailsElement.classList.remove('search-hidden');
    } else {
      detailsElement.classList.add('search-hidden');
    }
  });

  checkForNoResults();
});

document.getElementById('filter').addEventListener('input', event => {
  switch (event.target.value) {
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

renderScripts();

const main = document.querySelector('main');
main.style.minWidth = `${main.getBoundingClientRect().width}px`;
