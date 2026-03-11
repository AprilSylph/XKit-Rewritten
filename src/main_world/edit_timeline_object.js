export default function editTimelineObject (currentTimelineObject, changeEntries) {
  const timelineElement = this;
  const reactKey = Object.keys(timelineElement).find(key => key.startsWith('__reactFiber'));
  let fiber = timelineElement[reactKey];

  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    if (typeof props?.value?.onEditTimelineObject === 'function') {
      props.value.onEditTimelineObject(
        currentTimelineObject,
        value => Object.assign(value, Object.fromEntries(changeEntries)),
      );
      return;
    } else {
      fiber = fiber.return;
    }
  }
}
