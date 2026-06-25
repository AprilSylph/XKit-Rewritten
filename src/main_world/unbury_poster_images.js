export default function unburyPosterImages () {
  const placeholderElement = this;
  const reactKey = Object.keys(placeholderElement).find(key => key.startsWith('__reactFiber'));
  let fiber = placeholderElement[reactKey];

  while (fiber !== null) {
    const { posterImages } = fiber.memoizedProps || {};
    if (posterImages !== undefined) {
      return posterImages;
    } else {
      fiber = fiber.return;
    }
  }
}
