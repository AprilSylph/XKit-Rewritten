(function () {
  const excludeClass = 'xkit-shorten-posts-done';
  const shortenClass = 'xkit-shorten-posts-shortened';
  const buttonClass = 'xkit-shorten-posts-expand';

  const expandButton = Object.assign(document.createElement('button'), {
    textContent: 'Expand',
    className: buttonClass,
  });

  const unshortenOnClick = ({ target }) => {
    const { parentNode } = target;
    if (parentNode.classList.contains(shortenClass)) {
      const headerHeight = document.querySelector('header').getBoundingClientRect().height;
      const postMargin = parseInt(getComputedStyle(parentNode).getPropertyValue('margin-bottom'));

      parentNode.classList.remove(shortenClass);
      parentNode.scrollIntoView();
      window.scrollBy({ top: 0 - headerHeight - postMargin });
      parentNode.focus();

      parentNode.removeChild(target);
    }
  };

  const shortenPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');

    getPostElements({ excludeClass }).forEach(postElement => {
      if (postElement.getBoundingClientRect().height > (window.innerHeight * 1.5)) {
        postElement.classList.add(shortenClass);

        const expandButtonClone = expandButton.cloneNode(true);
        expandButtonClone.addEventListener('click', unshortenOnClick);
        postElement.appendChild(expandButtonClone);
      }
    });
  };

  const main = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.addListener(shortenPosts);
    shortenPosts();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/util/mutations.js');

    onNewPosts.removeListener(shortenPosts);

    $(`.${excludeClass}`).removeClass(excludeClass);
    $(`.${shortenClass}`).removeClass(shortenClass);
    $(`.${buttonClass}`).remove();
  };

  return { main, clean, stylesheet: true };
})();
