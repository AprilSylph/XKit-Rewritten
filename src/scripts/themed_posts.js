import { buildStyle, filterPostElements, blogViewSelector } from '../util/interface.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';

const styleElement = buildStyle();
const blogs = new Set();
let blacklist;

const defaultBackgroundColor = '#FAFAFA';

const hexToRGB = (hex) => {
  const { red, green, blue } = hex.match(/^#(?<red>[A-Fa-f0-9]{1,2})(?<green>[A-Fa-f0-9]{1,2})(?<blue>[A-Fa-f0-9]{1,2})$/).groups;
  return [red, green, blue]
    .map(color => color.padEnd(2, color))
    .map(color => parseInt(color, 16))
    .join(', ');
};

const processPosts = async function (postElements) {
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    if (postElement.matches(blogViewSelector)) return;

    const { blog: { name, theme } } = await timelineObject(postElement);

    if (blacklist.includes(name)) return;

    if (!blogs.has(name)) {
      blogs.add(name);

      const { backgroundColor, titleColor } = theme;

      const backgroundColorRGB = hexToRGB(backgroundColor);
      const titleColorRGB = hexToRGB(titleColor);

      styleElement.textContent += `
        [data-xkit-themed="${name}"] {
          --white: ${backgroundColorRGB};
          --black: ${titleColorRGB};
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
  onNewPosts.removeListener(processPosts);

  styleElement.remove();
  styleElement.textContent = '';

  $('[data-xkit-themed]').removeAttr('data-xkit-themed');

  blogs.clear();
};
