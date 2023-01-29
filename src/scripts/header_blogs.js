import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { buildStyle } from '../util/interface.js';
import { pageModifications } from '../util/mutations.js';
import { getPreferences } from '../util/preferences.js';
import { onClickNavigate } from '../util/tumblr_helpers.js';
import { userBlogs } from '../util/user.js';

const styleElement = buildStyle(`
  .xkit-header-avatar {
    height: 26px;
    width: 26px;
  }

  .xkit-header-avatar.circle {
    border-radius: 13px;
  }

  .xkit-header-avatar.square {
    border-radius: 3px;
  }

  #xkit-header-blogs {
    overflow: hidden;
    flex: 1.5;
    max-width: max-content;
  }

  #xkit-header-blogs-inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;

    height: 26px;

    column-gap: 12px;
    margin: 0px 12px;
  }

  header > ${keyToCss('menuRight')} > ${keyToCss('container')}:empty {
    margin: 0 !important;
  }
`);

let headerBlogElement;

const processRightMenu = ([rightMenu]) => {
  rightMenu.before(headerBlogElement);
};

export const main = async function () {
  const { maxBlogs } = await getPreferences('header_blogs');

  const avatarElements = userBlogs
    .slice(0, Number.parseInt(maxBlogs, 10) || Infinity)
    .map(({ name, avatar, theme: { avatarShape } }) => {
      const { url } = avatar[avatar.length - 1];
      return dom('a', { href: `/blog/${name}`, title: name }, { click: onClickNavigate }, [
        dom('img', { class: `xkit-header-avatar ${avatarShape}`, src: url })
      ]);
    });

  headerBlogElement = dom('div', { id: 'xkit-header-blogs' }, null, [
    dom('div', { id: 'xkit-header-blogs-inner' }, null, avatarElements)
  ]);

  document.head.append(styleElement);
  pageModifications.register(`header > ${keyToCss('menuRight')}`, processRightMenu);
};

export const clean = async function () {
  pageModifications.unregister(processRightMenu);

  headerBlogElement.remove();
  styleElement.remove();
};
