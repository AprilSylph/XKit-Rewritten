import { apiFetch } from './tumblr_helpers.js';

const [
  fetchedUserInfo,
  fetchedCommunitiesInfo,
] = await Promise.all([
  apiFetch('/v2/user/info').catch((error) => {
    console.error(error);
    return { response: {} };
  }),
  apiFetch('/v2/communities').catch((error) => {
    console.error(error);
    return { response: [] };
  }),
]);

/**
 * The contents of the `/v2/user/info` API endpoint
 * @type {object | undefined}
 */
export const userInfo = fetchedUserInfo.response.user;

/**
 * An array of blog objects the current user is a member of
 * @type {object[]}
 */
export const userBlogs = userInfo?.blogs ?? [];

/**
 * An array of blog names the current user is a member of
 * @type {string[]}
 */
export const userBlogNames = userBlogs.map(blog => blog.name);

/**
 * The primary ("main") blog for the user
 */
export const primaryBlog = userBlogs.find(blog => blog.primary === true);

/**
 * The name of the user's primary ("main") blog
 * @type {string | undefined}
 */
export const primaryBlogName = primaryBlog?.name;

/**
 * An array of blog objects the current user is an admin of
 */
export const adminBlogs = userBlogs?.filter(blog => blog.admin) ?? [];

/**
 * An array of blog names the current user is admin of
 * @type {string[]}
 */
export const adminBlogNames = adminBlogs.map(blog => blog.name);

let communitiesOrder = [];
try {
  communitiesOrder = JSON.parse(localStorage.getItem('sortableCommunitiesOrder')) ?? [];
} catch {}

const getOrder = community => {
  const index = communitiesOrder.indexOf(community.name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

/**
 * An array of community objects the current user has joined
 * @type {object[]}
 */
export const joinedCommunities = [...fetchedCommunitiesInfo.response].sort((a, b) => getOrder(a) - getOrder(b));

/**
 * An array of community UUIDs the current user has joined
 * @type {string[]}
 */
export const joinedCommunityUuids = joinedCommunities.map(community => community.uuid);
