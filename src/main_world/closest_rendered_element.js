export default function closestRenderedElement (selector) {
  const target = this;

  const reactKey = Object.keys(target).find(key => key.startsWith('__reactFiber'));
  let fiber = target[reactKey];

  while (fiber !== null) {
    if (fiber.stateNode instanceof Element && fiber.stateNode.matches(selector)) {
      return fiber.stateNode;
    } else {
      fiber = fiber.return;
    }
  }
}
