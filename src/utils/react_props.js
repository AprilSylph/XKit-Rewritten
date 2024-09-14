import { inject } from './inject.js';
import { primaryBlogName, userBlogNames, adminBlogNames } from './user.js';

const timelineObjectCache = new WeakMap();
const notificationObjectCache = new WeakMap();

/**
 * @param {Element} postElement - An on-screen post
 * @returns {Promise<object>} - The post's buried timelineObject property
 */
export const timelineObject = async function (postElement) {
  if (!timelineObjectCache.has(postElement)) {
    timelineObjectCache.set(
      postElement,
      inject('/main_world/unbury_timeline_object.js', [], postElement)
    );
  }
  return timelineObjectCache.get(postElement);
};

/**
 * @param {Element} notificationElement - An on-screen notification
 * @returns {Promise<object>} - The notification's buried notification property
 */
export const notificationObject = function (notificationElement) {
  if (!notificationObjectCache.has(notificationElement)) {
    notificationObjectCache.set(
      notificationElement,
      inject('/main_world/unbury_notification.js', [], notificationElement)
    );
  }
  return notificationObjectCache.get(notificationElement);
};

/**
 * @param {Element} meatballMenu - An on-screen meatball menu element in a blog modal header or blog card
 * @returns {Promise<object>} - The post's buried blog or blogSettings property. Some blog data fields, such as "followed," are not available in blog cards.
 */
export const blogData = async (meatballMenu) => inject('/main_world/unbury_blog.js', [], meatballMenu);

export const isMyPost = async (postElement) => {
  const { blog, isSubmission, postAuthor, community } = await timelineObject(postElement);
  const userIsMember = userBlogNames.includes(blog.name);
  const userIsAdmin = adminBlogNames.includes(blog.name);

  // Post belongs to the user's primary blog
  if (blog.name === primaryBlogName) return true;

  // Post belongs to the user's single-member sideblog
  if (postAuthor === undefined && userIsMember) return true;

  // Post was created by the user on a group blog
  if (postAuthor === primaryBlogName && !isSubmission) return true;

  // Post was created by the user in a community
  if (community && userBlogNames.includes(postAuthor)) return true;

  // Submission belongs to group blog which the user is admin of
  if (isSubmission && userIsAdmin) return true;

  return false;
};

/**
 * Manipulate post form tags
 * @param {object} options - Tags to add/remove to/from the current post form
 * @param {string[]} [options.add] - Tags to insert
 * @param {string[]} [options.remove] - Tags to remove
 * @returns {Promise<void>} Resolves when finished
 */
export const editPostFormTags = async ({ add = [], remove = [] }) =>
  inject('/main_world/control_tags_input.js', [{ add, remove }]);
