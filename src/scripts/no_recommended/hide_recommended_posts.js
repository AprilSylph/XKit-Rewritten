import { buildStyle, filterPostElements, postSelector } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';
import { timelineObject } from '../../util/react_props.js';

const excludeClass = 'xkit-no-recommended-posts-done';
const hiddenClass = 'xkit-no-recommended-posts-hidden';
const unHiddenClass = 'xkit-no-recommended-posts-many';
const timeline = /\/v2\/timeline\/dashboard/;
const includeFiltered = true;

const styleElement = buildStyle(`
.${hiddenClass}:not(.${unHiddenClass}) article {
  display: none;
}

:not(.${unHiddenClass}) + .${unHiddenClass}::before {
  content: 'Too many recommended posts to hide!';

  display: block;
  padding: 25px 20px;
  border-radius: 3px;
  margin-bottom: var(--post-padding);

  background-color: rgba(var(--white-on-dark), 0.13);
  color: rgba(var(--white-on-dark), 0.6);

  font-weight: 700;
  text-align: center;
  line-height: 1.5em;
}
`);

const precedingHiddenPosts = ({ previousElementSibling: previousElement }, count = 0) => {
  // If there is no previous sibling, stop counting
  if (!previousElement) return count;
  // If the previous sibling is not a post, skip over it
  if (!previousElement.matches(postSelector)) return precedingHiddenPosts(previousElement, count);
  // If the previous sibling is hidden, count it and continue
  if (previousElement.classList.contains(hiddenClass)) return precedingHiddenPosts(previousElement, count + 1);
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

    postElement.classList.add(hiddenClass);

    if (precedingHiddenPosts(postElement) >= 10) {
      postElement.classList.add(unHiddenClass);
    }
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  styleElement.remove();
};
