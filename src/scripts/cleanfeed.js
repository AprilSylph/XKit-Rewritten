import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { getPostElements, buildStyle } from '../util/interface.js';
import { translate } from '../util/language_data.js';
import { timelineObjectMemoized } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';

const excludeClass = 'xkit-cleanfeed-done';
const hiddenClass = 'xkit-cleanfeed-filtered';

const styleElement = buildStyle();

let blockingMode;
let localFlagging;

let localFlaggedBlogs;
let reblogSelector;

const processPosts = async function () {
  getPostElements({ excludeClass }).forEach(async postElement => {
    if (blockingMode === 'all') {
      postElement.classList.add(hiddenClass);
      return;
    }

    const { blog: { name, isAdult }, trail } = await timelineObjectMemoized(postElement.dataset.id);

    if (isAdult || localFlaggedBlogs.includes(name)) {
      postElement.classList.add(hiddenClass);
      return;
    }

    const reblogs = postElement.querySelectorAll(reblogSelector);
    trail.forEach((trailItem, i) => {
      if (trailItem.blog?.isAdult || localFlaggedBlogs.includes(trailItem.blog?.name)) {
        reblogs[i].classList.add(hiddenClass);
      }
    });
  });
};

export const main = async function () {
  ({ blockingMode, localFlagging } = await getPreferences('cleanfeed'));
  localFlaggedBlogs = localFlagging.split(',').map(username => username.trim());

  const avatarText = await translate('Avatar');
  styleElement.textContent = localFlaggedBlogs.map(username => `[title="${username}"] img[alt="${avatarText}"] { filter: blur(20px); }`).join('');
  document.head.append(styleElement);

  reblogSelector = await keyToCss('reblog');
  onNewPosts.addListener(processPosts);
  processPosts();
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};

export const stylesheet = true;
