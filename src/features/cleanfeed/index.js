import { removeClassName } from '../../utils/cleanup.js';
import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, filterPostElements } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { onNewPosts } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';

export const styleElement = buildStyle();

const hiddenClass = 'xkit-cleanfeed-filtered';
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

  const { blog, authorBlog, communityLabels, trail, tags } = await timelineObject(postElement);

  if (blog.isAdult ||
      authorBlog?.isAdult ||
      communityLabels.hasCommunityLabel ||
      localFlaggedBlogs.includes(blog.name) ||
      localFlaggedBlogs.includes(authorBlog?.name) ||
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

  const localFlaggedBlogsTitleSelector = `:is(${
    localFlaggedBlogs.map(username => `[title="${username}"]`).join(', ')
  })`;

  const mediaSelector =
    `.${hiddenClass}:not(:hover) :is(figure:not([aria-label]), [role="application"], a > ${keyToCss('withImage')})`;

  styleElement.textContent = `
  ${localFlaggedBlogsTitleSelector} img[alt="${translate('Avatar')}"] {
    filter: blur(20px);
  }

  ${mediaSelector} {
    isolation: isolate;
  }

  ${mediaSelector}::before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;

    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;

    background-color: var(--content-panel);
    background-image: linear-gradient(var(--content-tint-strong), var(--content-tint-strong));
    color: var(--content-fg-secondary);
    content: "Hidden by CleanFeed";
    line-height: 1.5;
    object-fit: cover;
    text-align: center;
  }

  ${mediaSelector}::after {
    z-index: 1;
  }
  `;

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  removeClassName(hiddenClass);
};
