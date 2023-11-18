const unburyBlog = (element) => {
  const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber'));
  let fiber = element[reactKey];

  while (fiber !== null) {
    const { blog, blogSettings } = fiber.memoizedProps || {};
    if (blog ?? blogSettings) {
      return blog ?? blogSettings;
    } else {
      fiber = fiber.return;
    }
  }
};

export default unburyBlog;
