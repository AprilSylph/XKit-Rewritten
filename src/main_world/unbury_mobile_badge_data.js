export default function unburyMobileBadgeData () {
  const badgeElement = this;
  const reactKey = Object.keys(badgeElement).find(key => key.startsWith('__reactFiber'));
  let fiber = badgeElement[reactKey];

  while (fiber) {
    const { unseenPostCount } = fiber.memoizedProps || {};
    if (unseenPostCount !== undefined) {
      const memoizedPropsEntries = Object.entries(fiber.memoizedProps);
      return Object.fromEntries(memoizedPropsEntries.filter(([key, value]) => typeof value === 'number'));
    } else {
      fiber = fiber.return;
    }
  }
}
