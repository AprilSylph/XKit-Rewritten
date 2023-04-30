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

const unburyBlog = () => {
  const element = document.currentScript.parentElement;
  const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber'));
  let fiber = element[reactKey];

  while (fiber !== null) {
    const { blog, blogSettings } = fiber.memoizedProps || {};
    if (blog ?? blogSettings) {
      return blog ?? blogSettings;
    } else {
      fiber = fiber.return;
    }
  }
};

/**
 * @param {Element} meatballMenu - An on-screen meatball menu element in a blog modal header or blog card
 * @returns {Promise<object>} - The post's buried blog or blogSettings property. Some blog data fields, such as "followed," are not available in blog cards.
 */
export const blogData = async (meatballMenu) => inject(unburyBlog, [], meatballMenu);

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
