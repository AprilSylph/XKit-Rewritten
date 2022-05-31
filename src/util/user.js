import { apiFetch } from './tumblr_helpers.js';

const fetchedUserInfo = await apiFetch('/v2/user/info').catch(() => ({ response: {} }));

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
