import { apiFetch } from './tumblr_helpers.js';

const userInfo = apiFetch('/v2/user/info');

/**
 * @returns {Promise<object[]>} - An array of blog objects the current user has post access to
 */
export const getUserBlogs = async function () {
  const { response: { user: { blogs } } } = await userInfo;
  return blogs;
};

/**
 * @returns {Promise<string[]>} - An array of blog names the current user has post access to
 */
export const getUserBlogNames = async function () {
  const blogs = await getUserBlogs();
  return blogs.map(blog => blog.name);
};

/**
 * @returns {Promise<object>} - The primary ("main") blog for the user
 */
export const getPrimaryBlog = async function () {
  const blogs = await getUserBlogs();
  return blogs.find(blog => blog.primary === true);
};

/**
 * @returns {Promise<string>} - The name of the user's primary blog
 */
export const getPrimaryBlogName = async function () {
  const primaryBlog = await getPrimaryBlog();
  return primaryBlog.name;
};
