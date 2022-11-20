import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { getPreferences } from '../util/preferences.js';
import { userBlogs } from '../util/user.js';

let shapeMode;

const styleElement = buildStyle(`
  .xkit-header-avatar {
    height: 26px;
    width: 26px;
  }

  #xkit-header-blogs.circle .xkit-header-avatar {
    border-radius: 13px;
  }

  #xkit-header-blogs.square .xkit-header-avatar {
    border-radius: 3px;
  }

  #xkit-header-blogs {
    overflow: hidden;
    flex: 1.5;
  }

  #xkit-header-blogs-inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: right;

    height: 26px;

    column-gap: 12px;
    margin: 0px 16px;
  }

  header > ${keyToCss('menuRight')} > ${keyToCss('container')}:empty {
    margin: 0 !important;
  }
`);

const avatarElements = userBlogs.map(({ name, avatar }) => {
  const { url } = avatar[avatar.length - 1];
  return dom('a', { href: `/blog/${name}`, title: name }, null, [
    dom('img', { class: 'xkit-header-avatar', src: url })
  ]);
});

const headerBlogElement = dom('div', { id: 'xkit-header-blogs' }, null, [
  dom('div', { id: 'xkit-header-blogs-inner' }, null, avatarElements)
]);

const processRightMenu = ([rightMenu]) => {
  rightMenu.before(headerBlogElement);
};

export const main = async function () {
  document.head.append(styleElement);
  ({ shapeMode } = await getPreferences('header_blogs'));

  headerBlogElement.classList.add(shapeMode);

  pageModifications.register(`header > ${keyToCss('menuRight')}`, processRightMenu);
};

export const clean = async function () {
  pageModifications.unregister(processRightMenu);

  headerBlogElement.remove();
  styleElement.remove();
};
