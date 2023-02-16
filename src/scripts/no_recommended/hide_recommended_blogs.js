import { keyToCss } from '../../util/css_map.js';
import { pageModifications } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { blogViewSelector, buildStyle } from '../../util/interface.js';

const hiddenClass = 'xkit-no-recommended-blogs-hidden';

const styleElement = buildStyle(`.${hiddenClass} { display: none; }`);

const hideDashboardRecommended = function (sidebarTitles) {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Check out these blogs'))
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));
};

const hideTagPageRecommended = blogsLists =>
  blogsLists
    .filter(ul => !ul.matches(blogViewSelector))
    .forEach(ul => ul.parentNode.classList.add(hiddenClass));

export const main = async function () {
  pageModifications.register('aside > div > h1', hideDashboardRecommended);

  const blogsListSelector = `${keyToCss('desktopContainer')} > ${keyToCss('recommendedBlogs')}`;
  pageModifications.register(blogsListSelector, hideTagPageRecommended);

  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(hideDashboardRecommended);
  pageModifications.unregister(hideTagPageRecommended);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
