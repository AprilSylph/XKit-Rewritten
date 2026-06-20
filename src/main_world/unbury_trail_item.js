export default function unburyTrailItem () {
  const postElement = this;
  const reactKey = Object.keys(postElement).find(key => key.startsWith('__reactFiber'));
  let fiber = postElement[reactKey];

  while (fiber !== null) {
    const { value } = fiber.memoizedProps || {};
    if (value?.trailItem !== undefined) {
      return value.trailItem;
    } else {
      fiber = fiber.return;
    }
  }
}
