import { keyToCss } from '../../utils/css_map.js';

const newTabLinkSelector = 'a[role="link"][target="_blank"]';
const columnOptionsSelector = keyToCss('columnOptions');
const blogViewLinkSelector = 'a[href^="/blog/view/"]';

/** @type {(event: PointerEvent) => void} */
const onDocumentClick = event => {
  if (
    event.target.closest(newTabLinkSelector) !== null &&
    event.target.closest(columnOptionsSelector) === null &&
    event.target.closest(blogViewLinkSelector) === null
  ) {
    event.stopPropagation();
    return; // Allow default behaviour
  }

  if (event.target.closest(blogViewLinkSelector) !== null) {
    event.stopPropagation();
    event.preventDefault();

    const { pathname } = new URL(event.target.href);
    const [blogName, postId] = pathname.split('/').slice(3);

    window.open(`https://${blogName}.tumblr.com/${postId ? `post/${postId}` : ''}`);
  }
};

export const main = async function () {
  document.documentElement.addEventListener('click', onDocumentClick, { capture: true });
};

export const clean = async function () {
  document.documentElement.removeEventListener('click', onDocumentClick, { capture: true });
};
