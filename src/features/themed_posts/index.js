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

const hexToRGBComponents = (hex) => {
  const { red, green, blue } = hex.match(groupsFromHex).groups;
  return [red, green, blue]
    .map(color => color.padEnd(2, color))
    .map(color => parseInt(color, 16));
};
const hexToRGB = (hex) => hexToRGBComponents(hex).join(', ');

// use round() to enforce chrome 125 instead of 119 to avoid any relative color bugs in prior versions
const enableAdvancedCss = CSS.supports('color', 'oklch(from #000000 round(l) c h');

const isLight = hex => hexToRGBComponents(hex).reduce((prev, cur) => prev + cur) > 128 * 3;
const increaseContrast = (hex, amount) =>
  `oklch(from ${hex} calc(l ${isLight(hex) ? '-' : '+'} ${amount}) c h)`;

const serializeElement = document.createElement('div');
document.documentElement.append(serializeElement);
const serializeColor = color => {
  serializeElement.style.color = `color(from ${color} srgb r g b)`;
  const result = getComputedStyle(serializeElement).color;
  return result.startsWith('color(srgb') ? result : undefined;
};
const serializeRGB = color => serializeColor(color)?.replace('color(srgb ', '').replace(')', '').split(' ').map(value => Number(value) * 256).join(', ');

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

        /* eslint-disable no-unused-vars */
        const {
          backgroundColor,
          titleColor,
          linkColor
        } = theme;

        const hexToRGBAdjusted = color =>
          color === backgroundColor && enableAdvancedCss
            ? serializeRGB(increaseContrast(color, 0.3)) ?? hexToRGB(color)
            : hexToRGB(color);

        const backgroundColorRGB = hexToRGB(backgroundColor);
        const titleColorRGB = hexToRGBAdjusted(backgroundColor);
        const linkColorRGB = hexToRGBAdjusted(backgroundColor);

        styleElement.textContent += `
          [data-xkit-themed="${name}"] {
            --white: ${backgroundColorRGB};
            --black: ${titleColorRGB};
            --deprecated-accent: ${linkColorRGB};
            --color-primary-link: rgb(var(--deprecated-accent));
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
