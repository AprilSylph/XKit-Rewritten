(function() {
  let userBlogs;

  /**
   * @return {Object[]} - An array of blog objects the current user has post access to
   */
  const fetchUserBlogs = async function() {
    if (!userBlogs) {
      const { apiFetch } = await fakeImport('/src/util/tumblr-helpers.js');
      const response = await apiFetch('/v2/user/info');
      if (response.meta.status === 200) {
        userBlogs = response.response.body.user.blogs;
      }
    }

    return userBlogs;
  };

  /**
   * @return {String[]} - An array of blog names the current user has post access to
   */
  const fetchUserBlogNames = async function() {
    const blogs = await fetchUserBlogs();
    return blogs.map(blog => blog.name);
  };

  /**
   * @return {String} - The default ("main") blog for the user
   */
  const fetchDefaultBlog = async function() {
    const blogs = await fetchUserBlogs();
    return blogs.filter(blog => blog.primary === true)[0];
  };

  return { fetchUserBlogs, fetchUserBlogNames, fetchDefaultBlog };
})();
