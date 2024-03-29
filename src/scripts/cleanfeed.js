import { onNewPosts } from '../util/mutations.js';
import { keyToCss } from '../util/css_map.js';
import { buildStyle, filterPostElements } from '../util/interface.js';
import { translate } from '../util/language_data.js';
import { timelineObject } from '../util/react_props.js';
import { getPreferences } from '../util/preferences.js';

const hiddenClass = 'xkit-cleanfeed-filtered';
const styleElement = buildStyle();
const reblogSelector = keyToCss('reblog');

let blockingMode;
let localBlogFlagging;
let localTagFlagging;
let localFlaggedBlogs;
let localFlaggedTags;

const processPosts = postElements => filterPostElements(postElements).forEach(async postElement => {
  if (blockingMode === 'all') {
    postElement.classList.add(hiddenClass);
    return;
  }

  const { blog: { name, isAdult }, communityLabels, trail, tags } = await timelineObject(postElement);

  if (isAdult ||
      communityLabels.hasCommunityLabel ||
      localFlaggedBlogs.includes(name) ||
      localFlaggedTags.some(t => tags.map(tag => tag.toLowerCase()).includes(t))) {
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

export const main = async function () {
  ({ blockingMode, localBlogFlagging, localTagFlagging } = await getPreferences('cleanfeed'));
  localFlaggedBlogs = localBlogFlagging.split(',').map(username => username.trim().toLowerCase());
  localFlaggedTags = localTagFlagging.split(',').map(tag => tag.replaceAll('#', '').trim().toLowerCase());

  styleElement.textContent = `
  .${hiddenClass}:not(:hover) figure:not([aria-label]),
  .${hiddenClass}:not(:hover) [role="application"] {
    position: relative;
  }

  .${hiddenClass}:not(:hover) figure:not([aria-label])::after,
  .${hiddenClass}:not(:hover) [role="application"]::after {
    position: absolute;
    top: 0;
    left: 0;

    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    height: 100%;
    width: 100%;
    line-height: 1.5;
    overflow: hidden;

    background-color: rgb(var(--white));
    background-image: linear-gradient(rgba(var(--black), 0.07), rgba(var(--black), 0.07));
    content: "Hidden by CleanFeed";
    color: rgba(var(--black), 0.65);
    object-fit: cover;
  }
  ` + localFlaggedBlogs
      .map(username => `[title="${username}"] img[alt="${translate('Avatar')}"] { filter: blur(20px); }`)
      .join('');

  document.documentElement.append(styleElement);
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  styleElement.remove();

  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
