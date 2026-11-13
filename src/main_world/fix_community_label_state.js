export default function fixCommunityLabelState (hasCommunityLabel) {
  const postElement = this;
  const articleElement = postElement.querySelector('article');

  if (articleElement) {
    const reactKey = Object.keys(articleElement).find(key => key.startsWith('__reactFiber'));
    let fiber = articleElement[reactKey];

    while (fiber !== null) {
      const { setCommunityLabel } = fiber.memoizedProps?.value || {};
      if (setCommunityLabel) {
        // sets 2 state hooks (to their initial values), working around some kind of tumblr lifecycle bug(?)
        // reference: search debugger source tab for `useState.{0,10}hasCommunityLabel`
        setCommunityLabel(hasCommunityLabel, undefined);
        return;
      } else {
        fiber = fiber.return;
      }
    }
  }
}
