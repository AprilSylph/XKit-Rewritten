import { inject } from './inject.js';
import { apiFetch } from './tumblr_helpers.js';

const unburyUserInfo = async () => {
  const baseContainerElement = document.getElementById('base-container');
  const reactKey = Object.keys(baseContainerElement).find(key => key.startsWith('__reactFiber'));
  let fiber = baseContainerElement[reactKey];

  while (fiber !== null) {
    const { appContext } = fiber.memoizedProps || {};
    if (appContext !== undefined) {
      return appContext.getUserInfo();
    } else {
      fiber = fiber.return;
    }
  }
};

/**
 * {object?} userInfo - The contents of the /v2/user/info API endpoint
 */
export const userInfo =
  (await inject(unburyUserInfo).catch(() => undefined)) ??
  (await apiFetch('/v2/user/info').catch(() => ({ response: {} })))?.response?.user;

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
