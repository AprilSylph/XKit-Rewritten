export default function unburyCellItem () {
  const cellElement = this;
  const reactKey = Object.keys(cellElement).find(key => key.startsWith('__reactFiber'));
  let fiber = cellElement[reactKey];

  while (fiber !== null) {
    const { item } = fiber.memoizedProps || {};
    if (item !== undefined) {
      return item;
    } else {
      fiber = fiber.return;
    }
  }
}
