import { keyToCss, keyToClasses } from '../util/css_map';
import { buildStyle } from '../util/interface';
import { translate } from '../util/language_data';
import { getPreferences } from '../util/preferences';

const styleElement = buildStyle();
styleElement.textContent = `
  ${keyToCss('createPost')} {
    width: 44px;
    margin-left: 10px;
    content: '';
  }
  ${keyToCss('createPost')} > a {
    border-radius: 3px !important;
    padding: 5px 12px !important;
  }
  ${keyToCss('navigationLinks')} svg { scale: 1.4; }
  ${keyToCss('navigationLinks')} {
    display: flex;
    flex-basis: 100%;
    margin: 0;
  }
  ${keyToCss('navigationLinks')} > ${keyToCss('navItem')} { border: none !important; }
  @media (max-width: 980px) {
    ${keyToCss('logoContainer')} {
      scale: 0.75;
      padding: 16px 16px 0px;
    }
    ${keyToCss('navigationLinks')} {
      justify-content: center;
    }
    ${keyToCss('mobileLayout')} {
      display: flex;
      justify-content: center;
    }
  }

  @media (min-width: 990px) {
    ${keyToCss('tabsHeader')} { margin-top: 0 !important; }
    ${keyToCss('searchSidebarItem')} {
      max-width: 550px;
      height: unset;
      padding: 0 8px;
    }
    ${keyToCss('navigation')} { border: none; }
    ${keyToCss('post')} ${keyToCss('stickyContainer')} ${keyToCss('avatar')}${keyToCss('newDesktopLayout')} {
      top: calc(70px + var(--dashboard-tabs-header-height,0px))
    }
    ${keyToCss('searchShadow')} { background: none; }
    ${keyToCss('blogTile')} { list-style-type: none; }
    ${keyToCss('subNav')} {
      background: RGB(var(--white));
      scrollbar-color: rgba(var(--black),.4)rgba(var(--white),.1);
      color: RGB(var(--black));
      position: absolute;
      border-radius: 4px;
      margin-top: 48px;
    }
    ${keyToCss('newDesktopLayout')} {
      z-index: 100;
      border-bottom: 1px solid rgba(var(--white-on-dark),.13) !important;
      position: -webkit-sticky !important;
      position: sticky !important;
      top: 0 !important;
      min-height: unset !important;
      background-color: RGB(var(--navy));
    }
    ${keyToCss('navigationLinks')} {
      justify-content: flex-end;
    }
    ${keyToCss('notificationBadgeIn')} { top: -70% !important; }
    ${keyToCss('timelineHeader')} { border: none; }
    ${keyToCss('mainContentWrapper')} {
      min-width: unset !important;
      flex-basis: unset !important;
    }
    ${keyToCss('main')} { border: none !important; }
    ${keyToCss('navigationWrapper')} { display: none !important; }
    ${keyToCss('navSubHeader')} {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(var(--black),.07);
      height: 36px;
      padding: 4px 12px 4px 12px;
      color: rgba(var(--black),.65);
    }
    ${keyToCss('navSubHeader')} a { text-decoration: none; }
    ${keyToCss('navSubHeader')} + ul {
      width: 100%;
      padding: 0 !important;
    }
    ${keyToCss('timelineHeaderNavInner')} { 'justify-content', 'center'; }
    ${keyToCss('sidebar')} {
      margin-left: 30px !important;
      position: sticky;
      top: 54px;
      height: fit-content;
    }
    ${keyToCss('sidebar')} aside { width: 320px; }
    ${keyToCss('about')}${keyToCss('inSidebar')}${keyToCss('usesNewDimensions')} {
      position: fixed;
      height: 20px;
      bottom: 0;
    }
    ${keyToCss('searchbarContainer')} {
      padding: 0;
      border: none;
      margin: 0;
    }
    #account_subnav {
      height: 85vh;
      width: 240px;
      overflow-y: scroll;
      overflow-x: hidden;
      overscroll-behavior: none;
      scrollbar-width: thin;
    }
    #settings_subnav {
      height: fit-content;
      z-index: 1;
      top: 96px;
      left: 8px;
      border: 2px solid rgba(var(--black),.14);
    }
    ${keyToCss('subNav')} a,${keyToCss('subNav')} ${keyToCss('childWrapper')},${keyToCss('subNav')} ${keyToCss('blogName')} { color: RGB(var(--black)) !important; }
    ${keyToCss('subNav')} ${keyToCss('endChildWrapper')},${keyToCss('subNav')} ${keyToCss('count')},${keyToCss('reorderButton')},${keyToCss('subNav')} ${keyToCss('blogTitle')} { color: rgba(var(--black),.65) !important; }
    ${keyToCss('navSubHeader')} a { color: rgba(var(--black),.65) !important; }
    ${keyToCss('subNav')} > ${keyToCss('navItem')}, ${keyToCss('accountStats')} li {
      list-style-type: none;
      border-bottom: 1px solid rgba(var(--black),.07);
    }
    ${keyToCss('subNav')} use { --icon-color-primary: rgba(var(--black),.65) }
    ${keyToCss('subNav')} > ${keyToCss('navItem')}:hover, ${keyToCss('accountStats')} li:hover {
      background-color: rgba(var(--black),.07);
    }
    ${keyToCss('subNav')} svg { scale: 1; }
    ${keyToCss('navInfo')} ${keyToCss('childWrapper')} {
      display: flex;
      align-items: center;
    }
    ${keyToCss('startChildWrapper')} + ${keyToCss('navInfo')}:not(.__subnavItem div) {
      display: none !important;
    }
    #settings_button_new ${keyToCss('navLink')} { justify-content: flex-start; }
    ${keyToCss('heading')} {
      position: sticky;
      top: 0;
      height: 36px;
      width: 240px !important;
      background: RGB(var(--white));
      z-index: 1;
      padding: 5px 20px 5px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: .875rem;
      color: rgba(var(--black),.65) !important;
      line-height: 1.5;
      box-sizing: border-box;
    }
    ${keyToCss('heading')}::before {
      position: absolute;
      top: 0;
      right: 0;
      width: 100%;
      height: 36px;
      content: '';
      background: rgba(var(--black),.07);
      pointer-events: none;
    }
    ${keyToCss('childWrapper')} > svg {
      margin-right: 10px;
    }
    @media (max-width: 1150px) {
      ${keyToCss('navItem')} ${keyToCss('buttonInner')} { padding: 8px 16px !important; }
    }
  }
`;
const match = [
  '',
  'dashboard',
  'settings',
  'blog',
  'domains',
  'search',
  'likes',
  'following',
  'inbox',
  'tagged',
  'explore',
  'reblog'
];
const pathname = location.pathname.split('/')[1];
const waitFor = (selector, retried = 0) => new Promise((resolve) => {
  if ($(selector).length) { resolve(); } else if (retried < 25) { waitFor(selector, retried + 1).then(resolve); }
});
const parser = new DOMParser();

let moveSettings;
let accountStats;
let newSearch;

const element = selector => document.querySelector(keyToCss(selector));
const newElement = str => parser.parseFromString(str);
const newIcon = name => newElement(`<svg xmlns='http://www.w3.org/2000/svg' height='18' width='20' role='presentation' style='--icon-color-primary: rgba(var(--black), 0.65);'><use href='#managed-icon__${name}'></use></svg>`);

export const main = async function () {
  ({ moveSettings, accountStats, newSearch } = await getPreferences('revert_vertical_nav'));
  const bluespaceLayout = element('bluespaceLayout');
  const newDesktopLayout = element('newDesktopLayout');
  const mainContentWrapper = element('mainContentWrapper');
  const logoContainer = element('logoContainer');
  const createPost = element('createPost');
  const navigationLinks = element('navigationLinks');
  const navigationItems = navigationLinks.children();
  const homeIcon = navigationItems.querySelector('use[href="#managed-icon__home"]');
  const inboxIcon = navigationItems.querySelector('use[href="#managed-icon__mail"]');
  const messagingIcon = navigationItems.querySelector('use[href="#managed-icon__messaging"]');
  const accountSubnav = document.getElementById('account_subnav');
  const newHeading = newElement(`<div id='xkit-uifix-newHeading' class='${keyToClasses('heading').join(' ')}'><h3>${translate('Account')}</h3></div>`);
  const logoutButton = element('logoutButton');

  if (match.includes(pathname)) {
    waitFor('searchbarContainer').then(() => {
      const searchbarContainer = element('searchbarContainer');
      newDesktopLayout.prependChild(searchbarContainer);
    });
  } else if (newSearch) {
    newDesktopLayout.prependChild(newElement(`
      <div class='${keyToClasses('searchSidebarItem').join(' ')}' style='max-width: 550px; width: 100%;' >
        <div class='${keyToClasses('formContainer').join(' ')}'>
          <span data-testid='controlled-popover-wrapper' class='${keyToClasses('targetWrapper').join(' ')}'>
            <span class='${keyToClasses('targetWrapper').join(' ')}'>
              <form method='GET' action='/search' role='search' class='${keyToClasses('form').join(' ')}'>
                <div class='${keyToClasses('searchbarContainer').join(' ')}'>
                  <div class='${keyToClasses('searchIcon').join(' ')}'>
                    <svg xmlns='http://www.w3.org/2000/svg' height='18' width='18' role='presentation' >
                      <use href='#managed-icon__search'></use>
                    </svg>
                  </div>
                  <input
                    name='q'
                    type='text'
                    autocomplete='off'
                    aria-label='${translate('Search')}'
                    class='${keyToClasses('searchbar').join(' ')}'
                    placeholder='${translate('Search Tumblr')}'
                    autocapitalize='sentences'
                    value=''
                  />
                </div>
              </form>
            </span>
          </span>
        </div>
      </div>
    `));
  }
  bluespaceLayout.appendChild(mainContentWrapper);
  newDesktopLayout.prependChild(logoContainer);
  newDesktopLayout.appendChild(createPost);
  homeIcon.insertAdjacentElement('afterend', inboxIcon);
  inboxIcon.insertAdjacentElement('afterend', messagingIcon);
  accountSubnav.prependChild(newHeading);
  newHeading.appendChild(logoutButton);
  $(document).on('click', () => {
    if ($('#account_subnav:hover').length) { return; }
    if ($('#account_subnav').attr('hidden')) { document.getElementById('account_button').click(); }
  });
  if (moveSettings) {
    const settings = navigationItems.querySelector('[href="/settings/account"]');
    settings.insertAfter(accountSubnav.children.querySelectorAll('li').querySelector('[href="/following"]'));
  }
  document.querySelector(`[href='/likes'] ${keyToCss('childWrapper')}`).prependChild(newIcon('like-filled'));
  document.querySelector(`[href='/following'] ${keyToCss('childWrapper')}`).prependChild(newIcon('following'));
  if (accountStats) {
    const blogData = window.___INITIAL_STATE___.queries.queries[0].state.data.user.blogs;
    const blogTiles = document.querySelectorAll('blogTile');
    for (let i = 0; i < blogData.length; ++i) {
      const tile = blogTiles.item(i);
      const blog = blogData[i];
      const caret = newElement(`
        <button class='${keyToClasses('button')[0]}' aria-label='${translate('Show Blog Statistics')}'>
            <span class='${keyToClasses('buttonInner').join(' ')} ${keyToClasses('menuTarget').join(' ')}' style='transform: rotate(0deg); display: flex; transition: transform 200ms ease-in-out 0s;' tabindex='-1'>
                <svg xmlns='http://www.w3.org/2000/svg' height='12' width='12' role='presentation'>
                    <use href='#managed-icon__caret-thin'></use>
                </svg>
            </span>
        </button>
      `);
      tile.find(keyToCss('actionButtons')).append(caret);
      caret.on('click', function () {
        if (element('accountStats').eq(i + 1).is(':hidden')) {
          $(this).css('transform', 'rotate(180deg)');
        } else { $(this).css('transform', 'rotate(0deg)'); }
        element('accountStats').eq(i + 1).toggle();
      });
      const stats = newElement(`
        <ul class='${keyToClasses('accountStats').join(' ')}'>
            <li>
                <a href='/blog/${blog.name}'>
                    <span>${translate('Posts')}</span>
                    <span class='${keyToClasses('count').join(' ')}'>${blog.posts ? blog.posts : ''}</span>
                </a>
            </li>
            <li>
                <a href='/blog/${blog.name}/followers'>
                    <span>${translate('Followers')}</span>
                    <span class='${keyToClasses('count').join(' ')}'>${blog.followers ? blog.followers : ''}</span>
                </a>
            </li>
            <li id='xkit-uifix-${blog.name}-activity'>
                <a href='/blog/${blog.name}/activity'>
                    <span>${translate('Activity')}</span>
                </a>
            </li>
            <li>
                <a href='/blog/${blog.name}/drafts'>
                    <span>${translate('Drafts')}</span>
                    <span class='${keyToClasses('count').join(' ')}'>${blog.drafts ? blog.drafts : ''}</span>
                </a>
            </li>
            <li>
                <a href='/blog/${blog.name}/queue'>
                    <span>${translate('Queue')}</span>
                    <span class='${keyToClasses('count').join(' ')}'>${blog.queue ? blog.queue : ''}</span>
                </a>
            </li>
            <li>
                <a href='/blog/${blog.name}/post-plus'>
                    <span>${translate('Post+')}</span>
                </a>
            </li>
            <li>
                <a href='/blog/${blog.name}/blaze'>
                    <span>${translate('Tumblr Blaze')}</span>
                </a>
            </li>
            <li>
                <a href='/settings/blog/${blog.name}'>
                    <span>${translate('Blog settings')}</span>
                </a>
            </li>
            <li>
                <a href='/mega-editor/published/${blog.name}' target='_blank'>
                    <span>${translate('Mass Post Editor')}</span>
                </a>
            </li>
        </ul>
      `);
      tile.insertAdjacentElement('afterend', stats);
      if (blog.isGroupChannel) {
        const members = newElement(`
          <li>
            <a href='/blog/${blog.name}/members' target='_blank'>
              <span>${translate('Members')}</span>
            </a>
          </li>
        `);
        document.getElementById(`#xkit-uifix-${blog.name}-activity`).insertAdjacentElement('afterend', members);
      }
      stats.hide();
    }
    element(`button[aria-label='${translate('Show Blog Statistics')}'`).click();
  }
  if (['blog', 'likes', 'following'].includes(pathname) && accountSubnav.attr('hidden')) { document.getElementById('account_button').click(); }

  document.documentElement.append(styleElement);
};

export const clean = async function () {
  styleElement.remove();
};
