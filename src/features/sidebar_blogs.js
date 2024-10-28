import { keyToCss } from '../utils/css_map.js';
import { dom } from '../utils/dom.js';
import { buildStyle } from '../utils/interface.js';
import { pageModifications } from '../utils/mutations.js';
import { onClickNavigate } from '../utils/tumblr_helpers.js';
import { userBlogs } from '../utils/user.js';

export const styleElement = buildStyle(`
:root {
  --sidebar-blogs-padding: 10px;
  --sidebar-blogs-size: 26px;
}
@media (pointer: fine) {
  :root {
    --sidebar-blogs-padding: 8px;
    --sidebar-blogs-size: 24px;
  }
}

@media (min-width: 1162px) {
  ${keyToCss('navigationLinks')} {
    display: flex;
    flex-direction: column;
  }
  #account_subnav {
    display: contents;
  }
  #account_subnav[hidden] > :not(${keyToCss('blogSectionWrapper')}) {
    display: none;
  }
  #account_subnav > ${keyToCss('blogSectionWrapper')} {
    order: 100;
  }
  #account_subnav ${keyToCss('navSubHeader')} {
    padding-bottom: var(--sidebar-blogs-padding);
  }

  #narrow-sidebar-avatars {
    display: none;
  }
}

.narrow-sidebar-avatar {
  padding: var(--sidebar-blogs-padding) 0;

  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.narrow-sidebar-avatar:hover {
  background-color: rgba(var(--white-on-dark), .07);
}
.narrow-sidebar-avatar > img {
  width: var(--sidebar-blogs-size);
  height: var(--sidebar-blogs-size);

  border-radius: 3px;
}
@media (min-width: 1018px) {
  .narrow-sidebar-avatar {
    padding: calc(var(--sidebar-blogs-padding) + 1px) 0;
  }
  .narrow-sidebar-avatar > img {
    width: calc(var(--sidebar-blogs-size) + 4px);
    height: calc(var(--sidebar-blogs-size) + 4px);
  }
}
`);

const narrowSidebarAvatars = dom('div', { id: 'narrow-sidebar-avatars' });

const processNavigationLinks = ([navigationLinks]) =>
  navigationLinks.append(narrowSidebarAvatars);

export const main = async function () {
  narrowSidebarAvatars.replaceChildren(
    ...userBlogs.map(({ name, avatar }) =>
      dom(
        'a',
        { href: `/blog/${name}`, title: name, class: 'narrow-sidebar-avatar' },
        { click: onClickNavigate },
        [dom('img', { src: avatar.at(-1)?.url })]
      )
    )
  );
  pageModifications.register(keyToCss('navigationLinks'), processNavigationLinks);
};

export const clean = async function () {
  pageModifications.unregister(processNavigationLinks);
  narrowSidebarAvatars.remove();
};
