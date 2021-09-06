import { apiFetch } from './tumblr_helpers.js';

const data = apiFetch('/v2/user/info');

/**
 * @returns {Promise<object[]>} - An array of blog objects the current user has post access to
 */
export const fetchUserBlogs = async function () {
  const { response: { user: { blogs } } } = await data;
  return blogs;
};

/**
 * @returns {Promise<string[]>} - An array of blog names the current user has post access to
 */
export const fetchUserBlogNames = async function () {
  const blogs = await fetchUserBlogs();
  return blogs.map(blog => blog.name);
};

/**
 * @returns {Promise<object>} - The default ("main") blog for the user
 */
export const fetchDefaultBlog = async function () {
  const blogs = await fetchUserBlogs();
  return blogs.find(blog => blog.primary === true);
};
