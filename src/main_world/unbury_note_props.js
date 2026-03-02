export default function unburyNoteProps () {
  const noteElement = this;
  const reactKey = Object.keys(noteElement).find(key => key.startsWith('__reactFiber'));
  let fiber = noteElement[reactKey];

  while (fiber !== null) {
    const props = fiber.memoizedProps || {};
    // finding rootReplyId ensures that we return the same props signature on parent/child/unthreaded replies
    if (props.rootReplyId && props.note?.replyId) {
      return props;
    }
    fiber = fiber.return;
  }
}
