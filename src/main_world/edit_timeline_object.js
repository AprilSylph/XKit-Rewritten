export default function editTimelineObject (currentTimelineObject, newTimelineObject) {
  const timelineElement = this;
  const reactKey = Object.keys(timelineElement).find(key => key.startsWith('__reactFiber'));
  let fiber = timelineElement[reactKey];

  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    if (typeof props?.value?.onEditTimelineObject === 'function') {
      props.value.onEditTimelineObject(
        currentTimelineObject,
        value => Object.assign(value, newTimelineObject)
      );
      return;
    } else {
      fiber = fiber.return;
    }
  }
}
