import { keyToCss } from '../util/css_map.js';

const linkSelector = 'a[role="link"][target="_blank"]';

const onDocumentClick = event => {
  if (
    event.target.matches(`${linkSelector}, ${linkSelector} *`) &&
    !event.target.closest(keyToCss('typeaheadBlogRow'))
  ) {
    event.stopPropagation();
  }
};

const onClickBlogViewLink = event => {
  event.stopPropagation();
  event.preventDefault();

  const { pathname } = new URL(event.target.href);
  const [blogName, postId] = pathname.split('/').slice(3);

  window.open(`https://${blogName}.tumblr.com/${postId ? `post/${postId}` : ''}`);
};

export const main = async function () {
  document.documentElement.addEventListener('click', onDocumentClick, { capture: true });
  $('#base-container').on('click', 'a[href^="/blog/view/"]', onClickBlogViewLink);
};

export const clean = async function () {
  document.documentElement.removeEventListener('click', onDocumentClick, { capture: true });
  $('#base-container').off('click', 'a[href^="/blog/view/"]', onClickBlogViewLink);
};
