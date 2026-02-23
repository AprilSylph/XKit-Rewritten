export default function getNotificationProps () {
  const notificationElement = this;
  const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
  let fiber = notificationElement[reactKey];

  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    if (props?.notification !== undefined) {
      return props.notification;
    } else {
      fiber = fiber.return;
    }
  }
}
