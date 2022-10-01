import { keyToCss } from '../util/css_map.js';
import { inject } from '../util/inject.js';
import { pageModifications } from '../util/mutations.js';

const tagElementSelector = `${keyToCss('tagsEditor')} ${keyToCss('editableTag')}`;

const doTagSmartQuotes = async () => {
  const selectedTagsElement = document.getElementById('selected-tags');
  if (!selectedTagsElement) { return; }

  const reactKey = Object.keys(selectedTagsElement).find(key =>
    key.startsWith('__reactFiber')
  );
  let fiber = selectedTagsElement[reactKey];

  while (fiber !== null) {
    let tags = fiber.stateNode?.state?.tags;
    if (Array.isArray(tags) && tags.some(tag => tag.includes('"'))) {
      tags = tags.map(tag =>
        tag
          .replace(/^"/, '\u201C')
          .replace(/ "/g, ' \u201C')
          .replace(/"/g, '\u201D')
      );
      fiber.stateNode.setState({ tags });
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

const onTagBlur = () => inject(doTagSmartQuotes);

const processTagElements = tagElements => {
  inject(doTagSmartQuotes);
  tagElements.forEach(tagElement => tagElement.addEventListener('blur', onTagBlur));
};

export const main = async function () {
  pageModifications.register(tagElementSelector, processTagElements);
};

export const clean = async function () {
  pageModifications.unregister(processTagElements);

  [...document.querySelectorAll(tagElementSelector)].forEach(tagElement =>
    tagElement.removeEventListener('blur', onTagBlur)
  );
};
