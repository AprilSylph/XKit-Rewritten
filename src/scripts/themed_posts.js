import { buildStyle, filterPostElements, blogViewSelector } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';

const styleElement = buildStyle();
const blogs = new Set();
let blacklist;

const defaultBackgroundColor = '#FAFAFA';

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

    let backgroundColorHex = hexToRGB(backgroundColor);
    const titleColorHex = hexToRGB(titleColor);

    if (backgroundColor === defaultBackgroundColor) {
      backgroundColorHex = '255, 255, 255';
    }

    if (!blogs.has(name)) {
      blogs.add(name);
      styleElement.textContent += `
        [data-xkit-themed="${name}"] {
          --white: ${backgroundColorHex};
          --black: ${titleColorHex};
        }
      `;
    }
    postElement.dataset.xkitThemed = name;
  });
};

export const main = async function () {
  const { blacklistedUsernames } = await getPreferences('themed_posts');
  blacklist = blacklistedUsernames.split(',').map(username => username.trim());
  document.head.append(styleElement);
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  $('[data-xkit-themed]').removeAttr('data-xkit-themed');
  styleElement.remove();
  blogs.clear();
  styleElement.textContent = '';
  onNewPosts.removeListener(processPosts);
};
