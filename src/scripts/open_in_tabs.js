const onClickExternalLink = event => event.stopPropagation();

const onClickBlogViewLink = event => {
  event.stopPropagation();
  event.preventDefault();

  const { pathname } = new URL(event.target.href);
  const [blogName, postId] = pathname.split('/').slice(3);

  window.open(`https://${blogName}.tumblr.com/post/${postId}`);
};

export const main = async function () {
  $('#base-container').on('click', 'a[role="link"][target="_blank"]', onClickExternalLink);
  $('#base-container').on('click', 'a[href^="/blog/view/"]', onClickBlogViewLink);
};

export const clean = async function () {
  $('#base-container').off('click', 'a[role="link"][target="_blank"]', onClickExternalLink);
  $('#base-container').off('click', 'a[href^="/blog/view/"]', onClickBlogViewLink);
};
