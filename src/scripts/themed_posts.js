import { buildStyle, filterPostElements, blogViewSelector, postSelector } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';
import { keyToCss } from '../util/css_map.js';

const styleElement = buildStyle();
const blogs = new Set();
const groupsFromHex = /^#(?<red>[A-Fa-f0-9]{1,2})(?<green>[A-Fa-f0-9]{1,2})(?<blue>[A-Fa-f0-9]{1,2})$/;
const reblogSelector = keyToCss('reblog');

let enableOnPeepr;
let blacklistedUsernames;

let blacklist;

let reblogTrailTheming = true;

const hexToRGB = (hex) => {
  const { red, green, blue } = hex.match(groupsFromHex).groups;
  return [red, green, blue]
    .map(color => color.padEnd(2, color))
    .map(color => parseInt(color, 16))
    .join(', ');
};

const processPosts = async function (postElements) {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    if (postElement.matches(blogViewSelector) && !enableOnPeepr) return;

    const { blog, trail = [] } = await timelineObject(postElement);

    const blogData = [
      blog,
      ...reblogTrailTheming ? trail.map(item => item.blog) : []
    ];

    blogData.forEach(({ name, theme }) => {
      if (blacklist.includes(name)) return;

      if (!blogs.has(name)) {
        blogs.add(name);

        const {
          backgroundColor,
          titleColor,
          linkColor
        } = theme;

        const backgroundColorRGB = hexToRGB(backgroundColor);
        const titleColorRGB = hexToRGB(titleColor);
        const linkColorRGB = hexToRGB(linkColor);

        styleElement.textContent += `
          [data-xkit-themed="${name}"] {
            --white: ${backgroundColorRGB};
            --black: ${titleColorRGB};
            --accent: ${linkColorRGB};
            --color-primary-link: rgb(var(--accent));
          }
        `;
      }
    });

    postElement.dataset.xkitThemed = blog.name ?? '';

    if (reblogTrailTheming) {
      [...postElement.querySelectorAll(reblogSelector)].forEach((reblog, i) => {
        reblog.dataset.xkitThemed = trail[i]?.blog?.name ?? '';
      });
    }
  });
};

export const main = async function () {
  ({ reblogTrailTheming, enableOnPeepr, blacklistedUsernames } = await getPreferences('themed_posts'));
  blacklist = blacklistedUsernames.split(',').map(username => username.trim());

  if (reblogTrailTheming) {
    styleElement.textContent += `
      ${postSelector} ${reblogSelector} {
        display: flow-root;
        margin-top: 0;
      }

      ${postSelector} ${reblogSelector}:not(:last-child) > :last-child {
        margin-bottom: 15px;
      }
    `;
  }

  document.documentElement.append(styleElement);
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  styleElement.remove();
  styleElement.textContent = '';

  $('[data-xkit-themed]').removeAttr('data-xkit-themed');

  blogs.clear();
};
