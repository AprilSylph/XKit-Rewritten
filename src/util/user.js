import { apiFetch } from './tumblr_helpers.js';

const userData = apiFetch('/v2/user/info')
  .catch(() => ({ response: {} }))
  .then(fetchedUserInfo => {
    /**
     * {object?} userInfo - The contents of the /v2/user/info API endpoint
     */
    const userInfo = fetchedUserInfo.response.user;

    /**
     * {object[]} userBlogs - An array of blog objects the current user has post access to
     */
    const userBlogs = userInfo?.blogs ?? [];

    /**
     * {string[]} userBlogNames - An array of blog names the current user has post access to
     */
    const userBlogNames = userBlogs.map(blog => blog.name);

    /**
     * {object?} primaryBlog - The primary ("main") blog for the user
     */
    const primaryBlog = userBlogs.find(blog => blog.primary === true);

    /**
     * {string?} primaryBlogName - The name of the user's primary blog
     */
    const primaryBlogName = primaryBlog?.name;

    /**
     * {object[]} adminBlogs - An array of blog objects the current user is admin of
     */
    const adminBlogs = userInfo?.blogs?.filter(blog => blog.admin) ?? [];

    /**
     * {string[]} adminBlogNames - An array of blog names the current user is admin of
     */
    const adminBlogNames = adminBlogs.map(blog => blog.name);

    return {
      userInfo,
      userBlogs,
      userBlogNames,
      primaryBlog,
      primaryBlogName,
      adminBlogs,
      adminBlogNames
    };
  });

export const useUserData = () => userData;
