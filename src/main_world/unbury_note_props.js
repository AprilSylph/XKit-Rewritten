export default function unburyNoteProps () {
  const noteElement = this;
  const reactKey = Object.keys(noteElement).find(key => key.startsWith('__reactFiber'));
  let fiber = noteElement[reactKey];

  const results = {};
  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    if (typeof props?.note?.replyId === 'string') {
      // returns the last set of props corresponding to each replyId, which contains the most information
      results[props.note.replyId] = props;
    }
    fiber = fiber.return;
  }
  return Object.values(results);
}
