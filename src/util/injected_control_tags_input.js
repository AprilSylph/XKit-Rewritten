const controlTagsInput = async ({ add, remove }) => {
  add = add.map(tag => tag.trim()).filter((tag, index, array) => array.indexOf(tag) === index);

  const selectedTagsElement = document.getElementById('selected-tags');
  if (!selectedTagsElement) { return; }

  const reactKey = Object.keys(selectedTagsElement).find(key => key.startsWith('__reactFiber'));
  let fiber = selectedTagsElement[reactKey];

  while (fiber !== null) {
    let tags = fiber.stateNode?.state?.tags;
    if (Array.isArray(tags)) {
      tags.push(...add.filter(tag => tags.includes(tag) === false));
      tags = tags.filter(tag => remove.includes(tag) === false);
      fiber.stateNode.setState({ tags });
      break;
    } else {
      fiber = fiber.return;
    }
  }
};

export default controlTagsInput;
