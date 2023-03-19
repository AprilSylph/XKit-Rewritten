import { pageModifications } from '../../util/mutations.js'; 

const linkSelector = 'a[role="link"][target="_blank"]';

const onClickExternalLink = event => event.stopPropagation();

const processLinks = links => links.forEach(link => link.addEventListener('click', onClickExternalLink));

const onClickBlogViewLink = event => {
  event.stopPropagation();
  event.preventDefault();

  const { pathname } = new URL(event.target.href);
  const [blogName, postId] = pathname.split('/').slice(3);

  window.open(`https://${blogName}.tumblr.com/${postId ? `post/${postId}` : ''}`);
};

export const main = async function () {
  pageModifications.register(linkSelector, processLinks); 
  $('#base-container').on('click', 'a[href^="/blog/view/"]', onClickBlogViewLink);
};

export const clean = async function () {
  pageModifications.unregister(processLinks); 
  [...document.querySelectorAll(linkSelector)].forEach(link => link.removeEventListener('click', onClickExternalLink));
  $('#base-container').off('click', 'a[href^="/blog/view/"]', onClickBlogViewLink);
};
