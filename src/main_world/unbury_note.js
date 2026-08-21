export default function unburyNote () {
  const noteElement = this;
  const reactKey = Object.keys(noteElement).find(key => key.startsWith('__reactFiber'));
  let fiber = noteElement[reactKey];

  while (fiber !== null) {
    const { note } = fiber.memoizedProps || {};
    if (note !== undefined) {
      return note;
    }
    fiber = fiber.return;
  }
}
