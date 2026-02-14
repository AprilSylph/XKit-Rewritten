import { keyToCss } from './css_map.js';
import { inject } from './inject.js';
import { apiFetch } from './tumblr_helpers.js';
import { primaryBlogName, userBlogNames, adminBlogNames } from './user.js';

/**
 * @param {Element} postElement An on-screen post element
 * @returns {Promise<object>} The post element's buried timelineObject property
 */
export const timelineObject = postElement => {
  postElement.timelineObjectPromise ??= inject('/main_world/unbury_timeline_object.js', [], postElement);
  return postElement.timelineObjectPromise;
};

/**
 * @param {Element} trailItemElement An on-screen reblog trail item element
 * @returns {Promise<object>} The trail item element's trailItem context value
 */
export const trailItem = trailItemElement => {
  trailItemElement.trailItemPromise ??= inject('/main_world/unbury_trail_item.js', [], trailItemElement);
  return trailItemElement.trailItemPromise;
};

/**
 * @param {Element} notificationElement An on-screen notification
 * @returns {Promise<object>} The notification's buried notification property
 */
export const notificationObject = notificationElement => {
  notificationElement.notificationObjectPromise ??= inject('/main_world/unbury_notification.js', [], notificationElement);
  return notificationElement.notificationObjectPromise;
};

/**
 * @param {Element} meatballMenu An on-screen meatball menu element in a blog modal header or blog card
 * @returns {Promise<object>} The post's buried blog or blogSettings property. Some blog data fields, such as "followed," are not available in blog cards.
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
 * @param {object} options Tags to add/remove to/from the current post form
 * @param {string[]} [options.add] Tags to insert
 * @param {string[]} [options.remove] Tags to remove
 * @returns {Promise<void>} Resolves when finished
 */
export const editPostFormTags = async ({ add = [], remove = [] }) =>
  inject('/main_world/control_tags_input.js', [{ add, remove }]);

/**
 * Request that Tumblr's frontend code re-render a post on the page with up-to-date data from the API.
 * @param {HTMLElement} postElement The target post element
 * @param {string[]} keys Array of timelineObject key names to update
 */
export const updatePostOnPage = async (postElement, keys) => {
  const currentTimelineObject = await timelineObject(postElement);
  const { response: newTimelineObject } = await apiFetch(`/v2/blog/${currentTimelineObject.blog.uuid}/posts/${currentTimelineObject.id}?reblog_info=true`);

  const changeEntries = Object.entries(newTimelineObject).filter(([key]) => keys.includes(key));

  await inject(
    '/main_world/edit_timeline_object.js',
    [currentTimelineObject, changeEntries],
    postElement.closest(keyToCss('timeline')),
  );
};
