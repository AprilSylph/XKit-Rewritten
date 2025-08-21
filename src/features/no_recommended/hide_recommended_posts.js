import { buildStyle, getTimelineItemWrapper, filterPostElements, postSelector } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { followingTimelineFilter } from '../../utils/timeline_id.js';

const excludeClass = 'xkit-no-recommended-posts-done';
const hiddenAttribute = 'data-no-recommended-posts-hidden';
const unHiddenAttribute = 'data-no-recommended-posts-many';
const timeline = followingTimelineFilter;
const includeFiltered = true;

export const styleElement = buildStyle(`
[${hiddenAttribute}]:not([${unHiddenAttribute}]) {
  content: linear-gradient(transparent, transparent);
  height: 0;
}

:not([${unHiddenAttribute}]) + [${unHiddenAttribute}]::before {
  content: 'Too many recommended posts to hide!';

  display: block;
  padding: 25px 20px;
  border-radius: 3px;
  margin-bottom: var(--post-padding);

  background-color: rgba(var(--white-on-dark), 0.13);
  color: rgba(var(--white-on-dark), 0.65);

  font-weight: 700;
  text-align: center;
  line-height: 1.5em;
}
`);

const precedingHiddenPosts = ({ previousElementSibling: previousElement }, count = 0) => {
  // If there is no previous sibling, stop counting
  if (!previousElement) return count;
  // If the previous sibling is hidden, count it and continue
  if (previousElement.matches(`[${hiddenAttribute}]`)) return precedingHiddenPosts(previousElement, count + 1);
  // If the previous sibling is not a post, skip over it
  if (!previousElement.matches(postSelector) || !previousElement.querySelector(postSelector)) return precedingHiddenPosts(previousElement, count);
  // Otherwise, we've hit a non-hidden post; stop counting
  return count;
};

const processPosts = async function (postElements) {
  filterPostElements(postElements, { excludeClass, timeline, includeFiltered }).forEach(async postElement => {
    const { recommendationReason } = await timelineObject(postElement);
    if (!recommendationReason) return;

    const { loggingReason } = recommendationReason;
    if (!loggingReason) return;

    if (loggingReason.startsWith('pin:')) return;
    if (loggingReason.startsWith('search:')) return;
    if (loggingReason === 'orbitznews') return;

    const timelineItem = getTimelineItemWrapper(postElement);

    timelineItem.setAttribute(hiddenAttribute, '');

    if (precedingHiddenPosts(timelineItem) >= 10) {
      timelineItem.setAttribute(unHiddenAttribute, '');
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  $(`[${unHiddenAttribute}]`).removeAttr(unHiddenAttribute);
};
