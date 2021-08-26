import { getPreferences } from '../util/preferences.js';
import { keyToCss } from '../util/css_map.js';
import { translate } from '../util/language_data.js';
import { onNewPosts } from '../util/mutations.js';
import { getPostElements } from '../util/interface.js';

let reblogSelector;

let trimAdditions;
let trimRebloggedCommentary;

const excludeClass = 'xkit-condensed-reblogs-done';
const contextItemClass = 'xkit-condensed-reblogs-context';

const expandButton = Object.assign(document.createElement('button'), { className: 'xkit-condensed-reblogs-expand' });
const onExpandButtonClick = ({ target }) => target.remove();

const processPosts = async function () {
  getPostElements({ excludeClass }).forEach(async postElement => {
    const reblogs = [...postElement.querySelectorAll(reblogSelector)];
    if (reblogs.length < 2) { return; }

    const contributedContent = postElement.querySelector('[data-is-contributed-content]');
    const firstReblog = reblogs[0];

    const expandButtonClone = expandButton.cloneNode(true);
    expandButtonClone.addEventListener('click', onExpandButtonClick);

    if (contributedContent !== null && trimAdditions) {
      const contextItem = contributedContent.previousElementSibling;
      if (contextItem !== firstReblog) {
        contextItem.classList.add(contextItemClass);
        firstReblog.parentNode.insertBefore(expandButtonClone, firstReblog);
      }
    } else if (contributedContent === null && trimRebloggedCommentary) {
      firstReblog.parentNode.insertBefore(expandButtonClone, firstReblog.nextElementSibling);
    }
  });
};

export const main = async function () {
  ({ trimAdditions, trimRebloggedCommentary } = await getPreferences('condensed_reblogs'));

  reblogSelector = await keyToCss('reblog');

  expandButton.textContent = await translate('Put reblogs back');

  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $('.xkit-condensed-reblogs-expand').remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${contextItemClass}`).removeClass(contextItemClass);
};

export const stylesheet = true;
