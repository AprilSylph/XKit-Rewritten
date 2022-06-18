import { keyToCss } from '../../util/css_map.js';
import { buildStyle, postSelector } from '../../util/interface.js';
import { translate } from '../../util/language_data.js';
import { pageModifications } from '../../util/mutations.js';

const hiddenClass = 'xkit-no-recommended-related-posts-hidden';

const styleElement = buildStyle(`
  .${hiddenClass} { position: relative; }
  .${hiddenClass} > div { visibility: hidden; position: absolute; max-width: 100%; }
  .${hiddenClass} > div img, .${hiddenClass} > div canvas { visibility: hidden; }
`);

const listTimelineObjectSelector = keyToCss('listTimelineObject');
const titleSelector = `${postSelector} + ${listTimelineObjectSelector} ${keyToCss('titleObject')}`;
const moreLikeThis = translate('More like this');

const hideRelatedRows = titleObjects => titleObjects
  .filter(titleObject => titleObject.innerText === moreLikeThis)
  .map(titleObject => titleObject.closest(listTimelineObjectSelector))
  .forEach(listTimelineObject => {
    listTimelineObject.classList.add(hiddenClass);
    listTimelineObject.nextElementSibling.classList.add(hiddenClass);
  });

export const main = async function () {
  document.head.append(styleElement);
  pageModifications.register(titleSelector, hideRelatedRows);
};

export const clean = async function () {
  pageModifications.unregister(hideRelatedRows);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
