(function () {
  const excludeClass = 'xkit-shorten-posts-done';
  const shortenClass = 'xkit-shorten-posts-shortened';

  const unshortenOnClick = ({ target }) => {
    if (target.classList.contains(shortenClass)) {
      target.classList.remove(shortenClass);
      target.scrollIntoView();
    }
  };

  const shortenPosts = async function () {
    const { getPostElements } = await fakeImport('/util/interface.js');

    getPostElements({ excludeClass }).forEach(postElement => {
      if (postElement.getBoundingClientRect().height > (window.innerHeight * 1.5)) {
        postElement.classList.add(shortenClass);
        postElement.addEventListener('click', unshortenOnClick);
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

    [...document.getElementsByClassName(shortenClass)].forEach(postElement => {
      postElement.classList.remove(shortenClass);
      postElement.removeEventListener('click', unshortenOnClick);
    });
  };

  return { main, clean, stylesheet: true };
})();
