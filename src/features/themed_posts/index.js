import { buildStyle, filterPostElements, blogViewSelector, postSelector } from '../../utils/interface.js';
import { getPreferences } from '../../utils/preferences.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { keyToCss } from '../../utils/css_map.js';

export const styleElement = buildStyle();

const blogs = new Set();
const groupsFromHex = /^#(?<red>[A-Fa-f0-9]{1,2})(?<green>[A-Fa-f0-9]{1,2})(?<blue>[A-Fa-f0-9]{1,2})$/;
const reblogSelector = keyToCss('reblog');
const timelineSelector = keyToCss('timeline');

let enableOnPeepr;
let blacklistedUsernames;
let missingPostMode;

let blacklist;

let reblogTrailTheming = true;

const clamp = (number, lower, upper) => Math.min(Math.max(number, lower), upper);
const average = array => array.reduce((prev, cur) => prev + cur, 0) / array.length;

const hexToRGBComponents = hex => {
  const { red, green, blue } = hex.match(groupsFromHex).groups;
  return [red, green, blue]
    .map(color => color.padEnd(2, color))
    .map(color => parseInt(color, 16));
};
const hexToRGB = hex => hexToRGBComponents(hex).join(', ');

const createContrastingColor = hex => {
  const components = hexToRGBComponents(hex);
  const isLight = average(components) > 128;
  const adjustment = isLight ? -100 : 100;

  return components
    .map(component => clamp(component + adjustment, 0, 255))
    .join(', ');
};

const processPosts = async function (postElements) {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    if (postElement.matches(blogViewSelector) && !enableOnPeepr) return;

    const { blog, authorBlog, trail = [], content, community } = await timelineObject(postElement);
    const visibleBlog = community ? authorBlog : blog;

    const blogData = [
      visibleBlog,
      ...reblogTrailTheming ? trail.map(item => item.blog).filter(item => item !== undefined) : []
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
        const titleColorRGB = titleColor === backgroundColor ? createContrastingColor(titleColor) : hexToRGB(titleColor);
        const linkColorRGB = linkColor === backgroundColor ? createContrastingColor(linkColor) : hexToRGB(linkColor);

        styleElement.textContent += `
          [data-xkit-themed="${name}"] {
            --white: ${backgroundColorRGB};
            --black: ${titleColorRGB};
            --deprecated-accent: ${linkColorRGB};
            --color-primary-link: rgb(var(--deprecated-accent));
            --content-panel: rgb(var(--white));
            --content-tint: rgba(var(--black), 0.07);
            --content-tint-strong: rgba(var(--black), 0.13);
            --content-tint-heavy: rgba(var(--black), 0.25);
            --content-fg: rgb(var(--black));
            --content-fg-secondary: rgba(var(--black), 0.65);
            --content-fg-tertiary: rgba(var(--black), 0.4);
            --modal: rgb(var(--white));
          }
        `;
      }
    });

    postElement.dataset.xkitThemed = visibleBlog.name ?? '';

    if (reblogTrailTheming) {
      const blogNameTrail = trail.map(item => item?.blog?.name);
      if (content.length > 0) {
        blogNameTrail.push(visibleBlog?.name);
      }
      [...postElement.querySelectorAll(reblogSelector)].forEach((reblog, i) => {
        reblog.dataset.xkitThemed = blogNameTrail[i] ?? '';
      });
    }
  });
};

export const main = async function () {
  ({ reblogTrailTheming, enableOnPeepr, blacklistedUsernames, missingPostMode } = await getPreferences('themed_posts'));
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
    if (missingPostMode === 'palette') {
      styleElement.textContent += `
        ${timelineSelector} {
          --xkit-root-white: var(--white);
          --xkit-root-black: var(--black);
          --xkit-root-accent: var(--deprecated-accent);
        }

        [data-xkit-themed] {
          --white: var(--xkit-root-white);
          --black: var(--xkit-root-black);
          --deprecated-accent: var(--xkit-root-accent);
        }
      `;
    }
  }

  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $('[data-xkit-themed]').removeAttr('data-xkit-themed');

  styleElement.textContent = '';
  blogs.clear();
};
