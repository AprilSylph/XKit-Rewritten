import { keyToCss, keyToClasses } from '../util/css_map.js';
import { buildStyle } from '../util/interface.js';
import { translate } from '../util/language_data.js';
import { userBlogs } from '../util/user.js';
import { pageModifications } from '../util/mutations.js';

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
const customClass = 'xkit-uifix';
const hiddenIconSelector = `${keyToCss('navigationLinks')} > ${keyToCss('navItem')}:is([title="${translate('Settings')}"],[title="${translate('Get a domain')}"],[title="${translate('Go Ad-Free')}"])`;

const styleElement = buildStyle();
styleElement.textContent = `
  @media (min-width: 990px) {
    ${keyToCss('bluespaceLayout')} > ${keyToCss('newDesktopLayout')} {
      margin-top: 55px;
    }
    ${keyToCss('reorderButton')} { color: rgba(var(--black),.65); }
    ${keyToCss('subNav')} use { --icon-color-primary: rgba(var(--black),.65) }
    ${keyToCss('heading')} {
      position: sticky;
      top: 0;
      height: 36px;
      width: 240px !important;
      background: RGB(var(--white));
      z-index: 1;
      margin: 0 !important;
      padding: 5px 20px 5px 10px !important;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: .875rem;
      color: rgba(var(--black),.65) !important;
      line-height: 1.5;
      box-sizing: border-box;
    }
    ${keyToCss('heading')}::before {
      background: rgba(var(--black),.07);
      content: '';
      width: 100%;
      height: 36px;
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }
    #account_subnav {
      background: RGB(var(--white));
      color: RGB(var(--black));
      max-height: 90vh;
      width: 240px;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: none;
      scrollbar-width: thin;
      scrollbar-color: rgba(var(--black),.4)rgba(var(--white),.1);
      position: fixed;
      top: 48px;
      border-radius: var(--border-radius-small);
      box-shadow: 0 0 15px rgba(0,0,0,.5);
    }
    ${keyToCss('subNav')} a,
      ${keyToCss('subNav')} ${keyToCss('childWrapper')},
      ${keyToCss('subNav')} ${keyToCss('blogName')},
      ${keyToCss('navSubHeader')} { color: RGB(var(--black)) !important; }
    ${keyToCss('subNav')} ${keyToCss('endChildWrapper')},
      ${keyToCss('subNav')} ${keyToCss('count')},
      ${keyToCss('reorderButton')},
      ${keyToCss('subNav')} ${keyToCss('blogTitle')},
      ${keyToCss('navSubHeader')},
      ${keyToCss('navSubHeader')} a { color: rgba(var(--black),.65) !important; }
    ${keyToCss('subNav')} > ${keyToCss('navItem')}, ${keyToCss('accountStats')} li {
      list-style-type: none;
    }
    ${keyToCss('subNav')} use { --icon-color-primary: rgba(var(--black),.65) }
    ${keyToCss('subNav')} > ${keyToCss('navItem')}:hover,
      ${keyToCss('accountStats')} li:hover {
        background-color: rgba(var(--black),.07);
      }
    ${keyToCss('navInfo')} ${keyToCss('childWrapper')} {
      display: flex;
      align-items: center;
    }
    ${keyToCss('childWrapper')} > svg {
      margin-right: 10px;
    }
    ${keyToCss('startChildWrapper')} > svg {
      width: 21px !important;
      height: 21px !important;
    }
    ${keyToCss('startChildWrapper')} + ${keyToCss('navInfo')}:not(#account_subnav div) {
      display: none !important;
    }
    ${keyToCss('searchSidebarItem')} {
      max-width: 480px;
      width: 100%;
      position: fixed;
      top: 10px;
      left: 140px;
      z-index: 100;
      height: fit-content;
      padding: 0;
      margin-top: 0;
    }
    .${customClass} ${keyToCss('searchIcon')} {
      display: flex;
      margin: 0 2px 0 12px;
    }
    .${customClass} ${keyToCss('searchIcon')} svg use { --icon-color-primary: rgba(var(--white-on-dark),.65); }
    .${customClass}:focus-within ${keyToCss('searchIcon')} svg use { --icon-color-primary: rgba(var(--black),.65); }
    ${keyToCss('logoContainer')} {
      justify-content: center;
      padding: 0px;
      display: flex;
      position: absolute;
      left: 100px;
    }
    ${keyToCss('navigationWrapper')} {
      height: 55px;
      display: flex;
      justify-content: center !important;
      width: 100%;
      margin: 0 !important;
      z-index: 100;
      position: fixed;
      top: 0;
      background-color: RGB(var(--navy));
      border-bottom: 1px solid rgba(var(--white-on-dark), .13);
    }
    ${keyToCss('navigation')} {
      max-width: 1716px;
      width: 100%;
      margin: auto;
      border: none;
      position: absolute;
    }
    ${keyToCss('primaryNavigation')} {
      height: 55px;
      padding: 0;
      justify-content: center;
    }
    ${keyToCss('navigationLinks')} {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      width: 100%;
      height: 55px;
      position: absolute;
      z-index: 100;
      right: 70px;
    }
    ${keyToCss('notificationBadgeIn')} {
      font-size: .8rem !important;
      height: 21px !important;
      top: -40% !important;
      visibility: visible !important;
    }
    ${keyToCss('navItem')}${keyToCss('open')} { border: none !important; }
    ${keyToCss('navItem')}:hover { background-color: transparent; }
    ${keyToCss('navItem')}[title='${translate('Home')}'] { order: -9; }
    ${keyToCss('navItem')}[title='${translate('Live')}'] { order: -8; }
    ${keyToCss('navItem')}[title='${translate('Explore')}'] { order: -7; }
    ${keyToCss('navigationLinks')} > ${keyToCss('targetPopoverWrapper')}:nth-of-type(3) { order: -6; }
    ${keyToCss('navItem')}[title='${translate('Inbox')}'] { order: -5; }
    ${keyToCss('navigationLinks')} > ${keyToCss('targetPopoverWrapper')}:nth-of-type(2) { order: -4; }
    ${keyToCss('navigationLinks')} > ${keyToCss('targetPopoverWrapper')}:nth-of-type(1) { order: -3; }
    ${keyToCss('navigationLinks')} >${keyToCss('navItem')},
      ${keyToCss('navigationLinks')} >${keyToCss('targetPopoverWrapper')} {
        width: 20px;
        margin: 0 16px;
      }
    ${keyToCss('navigationLinks')} > ${keyToCss('navItem')} ${keyToCss('navLink')},
      ${keyToCss('navigationLinks')} > ${keyToCss('targetPopoverWrapper')} ${keyToCss('navLink')} {
        padding: 0;
        gap: 0;
        justify-content: center;
      }
    ${keyToCss('mainContentWrapper')} {
      flex-basis: 976px;
      margin-top: 20px;
    }
    ${keyToCss('container')} { margin: 0; }
    ${keyToCss('main')} {
      margin-right: 16px;
      padding: 0;
      border: none !important;
    }
    ${keyToCss('bar')} { margin-bottom: 90px !important; }
    ${keyToCss('tabsHeader')} {
      width: 540px;
      position: relative;
      margin-top: 30px !important;
      left: 20px;
    }
    [aria-hidden] + ${keyToCss('tabsHeader')} {
      margin-top: -14px !important;
      top: 190px !important;
    }
    ${keyToCss('postColumn')}:not(.${keyToClasses('postColumn')[6]}) {
      position: relative;
      top: -54px;
    }
    ${keyToCss('stickyContainer')} > ${keyToCss('avatar')} { top: calc(70px + var(--dashboard-tabs-header-height, 0px)) !important; }
    ${keyToCss('createPost')} {
      height: 55px;
      position: absolute;
      justify-content: flex-end;
    }
    ${keyToCss('createPostButton')} {
      gap: 0 !important;
      border-radius: var(--border-radius-small) !important;
      max-width: 45px !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      font-size: 0px !important;
    }
    ${keyToCss('container')}${keyToCss('mainContentIs4ColumnMasonry')} { margin: 0 auto !important; }
    @media (max-width: 1150px) {
      ${keyToCss('searchSidebarItem')} {
        left: 60px;
        width: 320px;
      }
      #account_subnav { right: 150px; }
    }
    @media (min-width: 1716px) {
      ${keyToCss('searchSidebarItem')} { left: 240px; }
      #account_subnav { right: 50px; }
    }
  }
`;

const element = selector => $(keyToCss(selector));
const newIcon = (name, h, w) => $(`<svg class='${customClass}' xmlns='http://www.w3.org/2000/svg' height='${h}' width='${w}' role='presentation' style='--icon-color-primary: rgba(var(--black), 0.65);'><use href='#managed-icon__${name}'></use></svg>`);
const keyToClass = key => keyToClasses(key)[0];
const fetchStats = async () => {
  const data = userBlogs;
  for (const blog of data) {
    for (const key of ['posts', 'followers', 'drafts', 'queue']) {
      if (blog[key]) {
        const count = $(`<span class='${keyToClasses('count')[3]}'>${blog[key]}</span>`);
        if (key === 'posts') {
          count.appendTo($(`.${customClass}[href='/blog/${blog.name}']`));
        } else { count.appendTo($(`.${customClass}[href='/blog/${blog.name}/${key}']`)); }
      }
    }
    if (blog.isGroupChannel) {
      const members = $(`
        <li>
          <a class='${customClass}' href='/blog/${blog.name}/members' target='_blank'>
            <span>${translate('Members')}</span>
          </a>
        </li>
      `);
      members.insertAfter($(`#${customClass}-${blog.name}-activity`));
    }
  }
};
const addStats = () => {
  const blogTiles = element('blogTile');
  for (let i = 0; i < blogTiles.length; ++i) {
    const tile = blogTiles.eq(i);
    const blog = tile.find(keyToCss('displayName')).text();
    const caret = $(`
      <button class='${keyToClass('button')} ${customClass}' aria-label='${translate('Show Blog Statistics')}' style='transform: rotate(0deg); display: flex; transition: transform 200ms ease-in-out 0s;'>
          <span class='${keyToClass('buttonInner')} ${keyToClass('menuTarget')}' tabindex='-1'>
              <svg xmlns='http://www.w3.org/2000/svg' height='12' width='12' role='presentation'>
                  <use href='#managed-icon__caret-thin'></use>
              </svg>
          </span>
      </button>
    `);
    tile.find(keyToCss('actionButtons')).append(caret);
    caret.on('click', function () {
      if (element('accountStats').eq(i).is(':hidden')) {
        $(this).css('transform', 'rotate(180deg)');
      } else { $(this).css('transform', 'rotate(0deg)'); }
      element('accountStats').eq(i).toggle();
    });
    const stats = $(`
      <ul class='${keyToClass('accountStats')} ${customClass}'>
          <li>
              <a class='${customClass}' href='/blog/${blog}'>
                  <span>${translate('Posts')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/blog/${blog}/followers'>
                  <span>${translate('Followers')}</span>
              </a>
          </li>
          <li id='${customClass}-${blog}-activity'>
              <a class='${customClass}' href='/blog/${blog}/activity'>
                  <span>${translate('Activity')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/blog/${blog}/drafts'>
                  <span>${translate('Drafts')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/blog/${blog}/queue'>
                  <span>${translate('Queue')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/blog/${blog}/post-plus'>
                  <span>${translate('Post+')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/blog/${blog}/blaze'>
                  <span>${translate('Tumblr Blaze')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/settings/blog/${blog}'>
                  <span>${translate('Blog settings')}</span>
              </a>
          </li>
          <li>
              <a class='${customClass}' href='/mega-editor/published/${blog}' target='_blank'>
                  <span>${translate('Mass Post Editor')}</span>
              </a>
          </li>
      </ul>
    `);
    stats.insertAfter(tile);
    stats.hide();
  }
  fetchStats();
  $(`button.${customClass}`).eq(0).trigger('click');
};
const newSubnavItem = (title, href, icon, h, w) => {
  const navItem = $(`
    <li class='${keyToClasses('navItem').join(' ')} ${keyToClasses('newDesktopLayout').join(' ')} ${customClass}' title='${translate(title)}'>
      <a class='${keyToClasses('navLink').join(' ')}' href='${href}'>
        <div class='${keyToClasses('navInfo').join(' ')}'>
          <span class='${keyToClasses('childWrapper').join(' ')}'>${translate(title)}</span>
          <span class='${keyToClasses('endChildWrapper').join(' ')}'></span>
        </div>
      </a>
    </li>
  `);
  navItem.find(keyToCss('childWrapper')).prepend(newIcon(icon, h, w));
  return navItem;
};
const shuffleIcons = () => {
  const settings = newSubnavItem('Settings', '/settings/account', 'settings', 20, 20);
  settings.insertAfter(element('navItem').has('[href="/following"]'));
  const domains = newSubnavItem('Domains', '/domains', 'earth', 20, 20);
  domains.insertAfter(settings);
  const adFree = newSubnavItem('Go Ad-Free', '/settings/ad-free-browsing', 'sparkle', 21, 20);
  adFree.insertAfter(domains);
  const purchases = newSubnavItem('Payment & Purchases', '/settings/purchases', 'payment-purchases', 21, 20);
  purchases.insertAfter(adFree);
  const gifts = newSubnavItem('Gifts', '/settings/gifts', 'gift', 21, 20);
  gifts.insertAfter(purchases);
};
const navModfifcations = (elements) => {
  const accountSubnav = $('#account_subnav');
  const newHeading = $(`<div class='${customClass} ${keyToClass('heading')}'><h3>${translate('Account')}</h3></div>`);
  const logoutButton = element('logoutButton');
  const navSubHeader = element('navSubHeader');
  const navigationWrapper = element('navigationWrapper');

  if (!match.includes(pathname)) {
    element('layout').prepend($(`
      <div class='${customClass} ${keyToClass('searchSidebarItem')}'>
        <div class='${keyToClass('formContainer')}'>
          <span data-testid='controlled-popover-wrapper' class='${keyToClass('targetWrapper')}'>
            <span class='${keyToClass('targetWrapper')}'>
              <form method='GET' action='/search' role='search' class='${keyToClass('form')}'>
                <div class='${keyToClasses('searchbarContainer')[1]}'>
                  <div class='${keyToClasses('searchIcon')[5]}'>
                    <svg xmlns='http://www.w3.org/2000/svg' height='18' width='18' role='presentation' >
                      <use href='#managed-icon__search'></use>
                    </svg>
                  </div>
                  <input
                    name='q'
                    type='text'
                    autocomplete='off'
                    aria-label='${translate('Search')}'
                    class='${keyToClasses('searchbar')[1]}'
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
  navSubHeader.addClass(keyToClass('heading'));
  navigationWrapper.addClass(keyToClasses('headerWrapper').join(' '));
  accountSubnav.prepend(newHeading);
  newHeading.append(logoutButton);
  $(document).on('click', () => {
    if (!$('#account_subnav:hover').length && !$('#account_subnav').attr('hidden')) { document.getElementById('account_button').click(); }
  });

  $(elements).hide();
  shuffleIcons();
  addStats();

  $(`[href='/likes'] ${keyToCss('childWrapper')}`).prepend(newIcon('like-filled', 18, 20));
  $(`[href='/following'] ${keyToCss('childWrapper')}`).prepend(newIcon('following', 20, 21));
  $(`[href='/live/shop'] ${keyToCss('childWrapper')}`).prepend(newIcon('coins', 21, 20));
};

export const main = async function () {
  requestAnimationFrame(() => {
    $(`.${customClass}`).remove();

    pageModifications.register(hiddenIconSelector, navModfifcations);
    document.documentElement.append(styleElement);
  });
};

export const clean = async function () {
  requestAnimationFrame(() => {
    styleElement.remove();
    element('navSubHeader').removeClass(keyToClass('heading'));
    element('navigationWrapper').removeClass(keyToClasses('headerWrapper').join(' '));
    element('logoutButton').insertAfter($('#account_subnav').children('li').has('[href="/following"]'));
    $(`.${customClass}`).remove();
    element('navItem').has('[href="/settings/account"],[href="/settings/ad-free-browsing"],[href="/domains"]').show();
  });
};