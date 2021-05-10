import { apiFetch } from './tumblr_helpers.js';

let userBlogs;

/**
 * @returns {object[]} - An array of blog objects the current user has post access to
 */
export const fetchUserBlogs = async function () {
  if (!userBlogs) {
    const response = await apiFetch('/v2/user/info');
    if (response.meta.status === 200) {
      userBlogs = response.response.user.blogs;
    }
  }

  return userBlogs;
};

/**
 * @returns {string[]} - An array of blog names the current user has post access to
 */
export const fetchUserBlogNames = async function () {
  const blogs = await fetchUserBlogs();
  return blogs.map(blog => blog.name);
};

/**
 * @returns {object} - The default ("main") blog for the user
 */
export const fetchDefaultBlog = async function () {
  const blogs = await fetchUserBlogs();
  return blogs.find(blog => blog.primary === true);
};
