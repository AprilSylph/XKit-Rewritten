export default function unburyBlog() {
  const element = this;
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
}
