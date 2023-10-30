import { dom } from '../util/dom.js';
import { timelineObject } from '../util/react_props.js';
import { onNewPosts } from '../util/mutations.js';
import { translate } from '../util/language_data.js';
import { filterPostElements, buildStyle } from '../util/interface.js';
import { keyToCss } from '../util/css_map.js';
import { navigate } from '../util/tumblr_helpers.js';

const styleElement = buildStyle(`
  @media (min-width: 990px) {
    ${keyToCss('mainContentWrapper')} { margin-left: 85px; }
    ${keyToCss('tabsHeader')} { margin-left: -105px !important; }
    article > header ${keyToCss('avatar')} { display: none; }
  }
`);

const newScrollingAvatar = blog => {
  const avatar = dom('div', { class: 'xkit-sticky-container' }, null,
    [$(`
      <div class='xkit-outer-avatar'>
        <div class='xkit-avatar-wrapper' role='figure' aria-label='${translate('avatar')}'>
          <span data-testid='controlled-popover-wrapper' class='xkit-target-wrapper'>
            <span class='xkit-target-wrapper'>
              <a
                href='${blog.url}'
                title='${blog.name}'
                target='_blank' rel='noopener'
                role='link'
                class='xkit-blog-link'
                tabindex='0'
              >
                <div class='xkit-inner-avatar'>
                  <div class='xkit-inner-avatar-wrapper'>
                    <div class='xkit-placeholder'>
                      <img
                      class='xkit-avatar-image'
                      src='${blog.avatar[3].url}'
                      sizes='64px'
                      alt='${translate('Avatar')}'
                      style='width: 64px; height: 64px;'
                      loading='eager'>
                    </div>
                  </div>
                </div>
              </a>
            </span>
          </span>
        </div>
      </div>
    `)[0]]
  );
  avatar.querySelector('a').addEventListener('click', () => {navigate(blog.name)});
  return avatar;
};

const addAvatars = postElements => {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    const { blog } = await timelineObject(postElement);
    postElement.prepend(newScrollingAvatar(blog));
  });
};

export const main = async function () {
  document.documentElement.append(styleElement);
  onNewPosts.addListener(addAvatars);
};

export const clean = async function () {
  styleElement.remove();
  onNewPosts.removeListener(addAvatars);
  $('.xkit-sticky-container').remove();
};

export const stylesheet = true;
