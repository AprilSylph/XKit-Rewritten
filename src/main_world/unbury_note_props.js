export default function unburyNoteProps () {
  const noteElement = this;
  const reactKey = Object.keys(noteElement).find(key => key.startsWith('__reactFiber'));
  let fiber = noteElement[reactKey];

  const resultsByReplyId = {};
  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    if (typeof props?.note?.replyId === 'string') {
      // multiple sets of props correspond to each replyId;
      // prefer the last set, as it contains the most information
      resultsByReplyId[props.note.replyId] = props;
    }
    fiber = fiber.return;
  }
  return Object.values(resultsByReplyId);
}
