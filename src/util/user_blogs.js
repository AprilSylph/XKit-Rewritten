import { apiFetch } from './tumblr_helpers.js';

const data = apiFetch('/v2/user/info');

/**
 * @returns {Promise<object[]>} - An array of blog objects the current user has post access to
 */
export const getUserBlogs = async function () {
  const { response: { user: { blogs } } } = await data;
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
 * @returns {Promise<object>} - The default ("main") blog for the user
 */
export const getDefaultBlog = async function () {
  const blogs = await getUserBlogs();
  return blogs.find(blog => blog.primary === true);
};

/**
 * @returns {Promise<string>} - The blog name of the user's primary blog
 */
export const getDefaultBlogName = async function () {
  const defaultBlog = await getDefaultBlog();
  return defaultBlog.name;
};
