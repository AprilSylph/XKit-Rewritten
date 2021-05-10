(function () {
  let userBlogs;

  /**
   * @returns {object[]} - An array of blog objects the current user has post access to
   */
  const fetchUserBlogs = async function () {
    if (!userBlogs) {
      const { apiFetch } = await import('../util/tumblr_helpers.js');
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
  const fetchUserBlogNames = async function () {
    const blogs = await fetchUserBlogs();
    return blogs.map(blog => blog.name);
  };

  /**
   * @returns {object} - The default ("main") blog for the user
   */
  const fetchDefaultBlog = async function () {
    const blogs = await fetchUserBlogs();
    return blogs.find(blog => blog.primary === true);
  };

  return { fetchUserBlogs, fetchUserBlogNames, fetchDefaultBlog };
})();
