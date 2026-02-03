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
 * {object?} userInfo - The contents of the /v2/user/info API endpoint
 */
export const userInfo = fetchedUserInfo.response.user;

/**
 * {object[]} userBlogs - An array of blog objects the current user has post access to
 */
export const userBlogs = userInfo?.blogs ?? [];

/**
 * {string[]} userBlogNames - An array of blog names the current user has post access to
 */
export const userBlogNames = userBlogs.map(blog => blog.name);

/**
 * {object?} primaryBlog - The primary ("main") blog for the user
 */
export const primaryBlog = userBlogs.find(blog => blog.primary === true);

/**
 * {string?} primaryBlogName - The name of the user's primary blog
 */
export const primaryBlogName = primaryBlog?.name;

/**
 * {object[]} adminBlogs - An array of blog objects the current user is admin of
 */
export const adminBlogs = userInfo?.blogs?.filter(blog => blog.admin) ?? [];

/**
 * {string[]} adminBlogNames - An array of blog names the current user is admin of
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
 * {object?} joinedCommunities - An array of community objects the current user has joined
 */
export const joinedCommunities = [...fetchedCommunitiesInfo.response].sort((a, b) => getOrder(a) - getOrder(b));

/**
 * {string[]} joinedCommunityUuids - An array of community uuids the current user has joined
 */
export const joinedCommunityUuids = joinedCommunities.map(community => community.uuid);
