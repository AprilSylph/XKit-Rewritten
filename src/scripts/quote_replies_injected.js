const getNotificationProps = function (notificationElement) {
  const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
  let fiber = notificationElement[reactKey];

  while (fiber !== null) {
    const { notification } = fiber.memoizedProps || {};
    if (notification !== undefined) {
      return notification;
    } else {
      fiber = fiber.return;
    }
  }
};

export default getNotificationProps;
