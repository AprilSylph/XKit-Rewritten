import { buildStyle, filterPostElements, blogViewSelector } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';

const styleElement = buildStyle();
const blogs = new Set();
let blacklist;

const hexToRGB = (hex) => {
  const chars = hex.replace('#', '').split('');
  const splitnum = chars.length > 3 ? 2 : 1;
  const arr = [];
  while (chars.length) {
    arr.push(parseInt(chars.splice(0, splitnum).join(''), 16));
  }
  return arr.join(', ');
};

const processPosts = async function (postElements) {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    if (postElement.matches(blogViewSelector)) return;

    const { blog: { name, theme: { backgroundColor, titleColor } } } =
      await timelineObject(postElement);

    if (blacklist.includes(name)) return;

    if (!blogs.has(name)) {
      blogs.add(name);
      styleElement.textContent += `
        .xkit-themed-${name} {
          --white: ${hexToRGB(backgroundColor)};
          --black: ${hexToRGB(titleColor)};
        }
      `;
    }
    postElement.classList.add(`xkit-themed-${name}`);
  });
};

export const main = async function () {
  const { blacklistedUsernames } = await getPreferences('themed_posts');
  blacklist = blacklistedUsernames.split(',').map(username => username.trim());
  document.head.append(styleElement);
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  blogs.forEach(name => $(`.xkit-themed-${name}`).removeAttr(`xkit-themed-${name}`));
  blogs.clear();
  styleElement.remove();
  styleElement.textContent = '';
  onNewPosts.removeListener(processPosts);
};
