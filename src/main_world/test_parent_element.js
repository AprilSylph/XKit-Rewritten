export default function testParentElement (selector) {
  const menuElement = this;
  const reactKey = Object.keys(menuElement).find(key => key.startsWith('__reactFiber'));
  let fiber = menuElement[reactKey];

  while (fiber !== null) {
    if (fiber.stateNode?.matches?.(selector)) {
      return true;
    } else {
      fiber = fiber.return;
    }
  }
}
