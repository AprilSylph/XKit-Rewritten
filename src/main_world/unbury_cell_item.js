export default function unburyCellItem () {
  const postElement = this;
  const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
  let fiber = postElement[reactKey];

  while (fiber !== null) {
    const { item } = fiber.memoizedProps || {};
    if (item !== undefined) {
      return item;
    } else {
      fiber = fiber.return;
    }
  }
}
