import { buildStyle, getPostElements } from '../../util/interface.js';
import { onNewPosts } from '../../util/mutations.js';
import { exposeTimelines, timelineObject } from '../../util/react_props.js';

const excludeClass = 'xkit-no-recommended-posts-done';
const hiddenClass = 'xkit-no-recommended-posts-hidden';
const timeline = /\/v2\/timeline\/dashboard/;
const includeFiltered = true;

const styleElement = buildStyle(`.${hiddenClass} article { display: none; }`);

const processPosts = async function () {
  await exposeTimelines();

  getPostElements({ excludeClass, timeline, includeFiltered }).forEach(async postElement => {
    const { recommendationReason } = await timelineObject(postElement.dataset.id);
    if (!recommendationReason) return;

    const { loggingReason } = recommendationReason;
    if (!loggingReason) return;

    if (loggingReason.startsWith('pin:')) return;
    if (loggingReason.startsWith('search:')) return;
    // TODO: Exclude posts recommended from the "Include stuff in your orbit" option

    postElement.classList.add(hiddenClass);
  });
};

export const main = async function () {
  onNewPosts.addListener(processPosts);
  processPosts();
  document.head.append(styleElement);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${excludeClass}`).removeClass(excludeClass);
  $(`.${hiddenClass}`).removeClass(hiddenClass);
  styleElement.remove();
};
