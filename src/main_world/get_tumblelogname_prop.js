export default function getTumblelogNameProp () {
  const notificationElement = this;
  const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
  let fiber = notificationElement[reactKey];

  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    if (props?.tumblelogName !== undefined) {
      return props.tumblelogName;
    } else {
      fiber = fiber.return;
    }
  }
}
