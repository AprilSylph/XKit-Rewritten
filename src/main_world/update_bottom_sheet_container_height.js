export default function updateBottomSheetContainerHeight () {
  const container = this;
  const reactKey = Object.keys(container).find(key => key.startsWith('__reactFiber'));
  const fiber = container[reactKey];

  /**
   * Re-run the callback that is executed when this element is added to the DOM.
   * In this case, the Tumblr frontend queries this.clientHeight and saves it in a state hook.
   * @see https://react.dev/reference/react-dom/components/common#ref-callback
   */
  if (typeof fiber?.ref === 'function') {
    fiber.ref(container);
  }
}
