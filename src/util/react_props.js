import { inject } from './inject.js';
import { getPrimaryBlogName } from './user.js';

const timelineObjectCache = new WeakMap();

const unburyTimelineObject = () => {
  const postElement = document.currentScript.parentElement;
  const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
  let fiber = postElement[reactKey];

  while (fiber !== null) {
    const { timelineObject } = fiber.memoizedProps || {};
    if (timelineObject !== undefined) {
      return timelineObject;
    } else {
      fiber = fiber.return;
    }
  }
};

/**
 * @param {Element} postElement - An on-screen post
 * @returns {Promise<object>} - The post's buried timelineObject property
 */
export const timelineObject = async function (postElement) {
  if (!timelineObjectCache.has(postElement)) {
    timelineObjectCache.set(postElement, inject(unburyTimelineObject, [], postElement));
  }
  return timelineObjectCache.get(postElement);
};

const primaryBlogName = await getPrimaryBlogName().catch(() => undefined);
export const isMyPost = async (postElement) => {
  const { canEdit, isSubmission, postAuthor } = await timelineObject(postElement);
  return canEdit && (isSubmission || postAuthor === primaryBlogName || postAuthor === undefined);
};

const controlTagsInput = async ({ add, remove }) => {
  add = add.map(tag => tag.trim()).filter((tag, index, array) => array.indexOf(tag) === index);

  const selectedTagsElement = document.getElementById('selected-tags');
  if (!selectedTagsElement) { return; }

  const reactKey = Object.keys(selectedTagsElement).find(key => key.startsWith('__reactFiber'));
  let fiber = selectedTagsElement[reactKey];

  while (fiber !== null) {
    let tags = fiber.stateNode?.state?.tags;
    if (Array.isArray(tags)) {
      tags.push(...add.filter(tag => tags.includes(tag) === false));
      tags = tags.filter(tag => remove.includes(tag) === false);
      fiber.stateNode.setState({ tags });
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

/**
 * Manipulate post form tags
 *
 * @param {object} options - Tags to add/remove to/from the current post form
 * @param {string[]} [options.add] - Tags to insert
 * @param {string[]} [options.remove] - Tags to remove
 * @returns {Promise<void>} Resolves when finished
 */
export const editPostFormTags = async ({ add = [], remove = [] }) => inject(controlTagsInput, [{ add, remove }]);
