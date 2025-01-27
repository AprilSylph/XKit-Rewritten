export default function testParentElement (selector) {
  const element = this;
  const reactKey = Object.keys(element).find(key => key.startsWith('__reactFiber'));
  let fiber = element[reactKey];

  while (fiber !== null) {
    if (fiber.stateNode?.matches?.(selector)) {
      return true;
    } else {
      fiber = fiber.return;
    }
  }
}
