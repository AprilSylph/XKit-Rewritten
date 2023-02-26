import { buildStyle, filterPostElements, postSelector } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';
import { timelineObject } from '../../util/react_props.js';

const excludeClass = 'xkit-no-recommended-posts-done';
const hiddenClass = 'xkit-no-recommended-posts-hidden';
const unHiddenClass = 'xkit-no-recommended-posts-many';
const timeline = /\/v2\/timeline\/dashboard/;
const includeFiltered = true;

const styleElement = buildStyle(`.${hiddenClass}:not(.${unHiddenClass}) article { display: none; }`);

const precedingHiddenPosts = ({ previousElementSibling: previousElement }, count = 0) => {
  if (!previousElement) return count;
  if (!previousElement.matches(postSelector)) return precedingHiddenPosts(previousElement, count);
  if (previousElement.classList.contains(hiddenClass)) return precedingHiddenPosts(previousElement, count + 1);
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
