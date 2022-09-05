import { keyToCss } from './css_map.js';
import { inject } from './inject.js';
import { primaryBlogName, userBlogNames, adminBlogNames } from './user.js';

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

export const isMyPost = async (postElement) => {
  const { blog, isSubmission, postAuthor } = await timelineObject(postElement);
  const userIsMember = userBlogNames.includes(blog.name);
  const userIsAdmin = adminBlogNames.includes(blog.name);

  // Post belongs to the user's primary blog
  if (blog.name === primaryBlogName) return true;

  // Post belongs to the user's single-member sideblog
  if (postAuthor === undefined && userIsMember) return true;

  // Post was created by the user on a group blog
  if (postAuthor === primaryBlogName && !isSubmission) return true;

  // Submission belongs to group blog which the user is admin of
  if (isSubmission && userIsAdmin) return true;

  return false;
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

const controlPostFormStatus = (status, publishOnMs) => {
  const button = document.currentScript.parentElement;
  const reactKey = Object.keys(button).find(key => key.startsWith('__reactFiber'));

  const isScheduled = status === 'scheduled';
  let fiber = button[reactKey];
  while (fiber !== null) {
    if (fiber.stateNode?.state?.isDatePickerVisible !== undefined) {
      fiber.stateNode.setState({ isDatePickerVisible: isScheduled });
      break;
    } else {
      fiber = fiber.return;
    }
  }

  fiber = button[reactKey];
  while (fiber !== null) {
    if (fiber.stateNode?.setFormPostStatus && fiber.stateNode?.onChangePublishOnValue) {
      fiber.stateNode.setFormPostStatus(status);
      if (status === 'schedule' && publishOnMs) {
        fiber.stateNode.onChangePublishOnValue(new Date(publishOnMs));
      }
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

/**
 * Manipulate post form submit button status
 *
 * @param {'now'|'queue'|'draft'|'private'|'schedule'} status - Mode to set the post form submit button to
 * @param {Date?} publishOn - Date value to set the post schedule to, if status is "schedule"
 */
export const editPostFormStatus = async (status, publishOn) => {
  const button = document.querySelector(`${keyToCss('postFormButton')} button`);
  if (!button) throw new Error('Missing button element to edit post form status');

  await inject(controlPostFormStatus, [status, publishOn?.getTime()], button);
};
