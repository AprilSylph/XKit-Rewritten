import { pageModifications } from '../util/mutations.js';
import { inject } from '../util/inject.js';
import { keyToCss } from '../util/css_map.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { buildStyle } from '../util/interface.js';
import { userBlogNames } from '../util/user.js';

const yourReblogClass = 'kjsfdhksjdhfks';
const notYourReblogClass = 'kdsjfdskkdhfsk';

const styleElement = buildStyle(`
.${yourReblogClass} {
  border: 1px solid RGB(var(--green)) !important;
}
.${notYourReblogClass} {
  border: 1px solid RGB(var(--red)) !important;
}
.${yourReblogClass}::before {
  content: "original reblog!";

  color: RGB(var(--green));
  text-align: center;
  font-family: var(--font-family);
  font-size: .875rem;
  width: 6em;
}
.${notYourReblogClass}::before {
  content: "non original reblog!";

  color: RGB(var(--red));
  text-align: center;
  font-family: var(--font-family);
  font-size: .875rem;
  width: 6em;
}
`);

const unburyNotification = () => {
  const notificationElement = document.currentScript.parentElement;
  const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactFiber'));
  let fiber = notificationElement[reactKey];

  while (fiber !== null) {
    const { notification } = fiber.memoizedProps || {};
    if (notification !== undefined) {
      return notification;
    } else {
      fiber = fiber.return;
    }
  }
};

let fetchedPosts = {};

const processNotifications = notifications =>
  notifications.forEach(async notification => {
    const { targetRootPostId, targetTumblelogName } = await inject(unburyNotification, [], notification);
    // targetRootPostId is only set if it differs from targetPostId, i.e. this note is for a reblog
    const isNoteForReblog = Boolean(targetRootPostId);

    if (!isNoteForReblog) return;

    if (userBlogNames.includes(targetTumblelogName) === false) {
      alert('this should be impossible afaik');
      return;
    }

    fetchedPosts[targetRootPostId] ??= apiFetch(`/v2/blog/${targetTumblelogName}/posts/${targetRootPostId}`)
      .then(({ response }) => response)
      .catch(() => undefined);

    const yourPost = Boolean(await fetchedPosts[targetRootPostId]);
    notification.classList.add(yourPost ? yourReblogClass : notYourReblogClass);

    // const info = document.createElement('div');
    // info.style = `
    //   background-color: RGB(var(--white));
    //   color: RGB(var(--accent));
    //   white-space: pre;
    //   font-family: var(--font-family);
    //   font-size: .875rem;
    // `;
    // notification.before(info);
    // info.append();
  });

export const main = async function () {
  document.head.append(styleElement);
  pageModifications.register(keyToCss('notification'), processNotifications);
};

export const clean = async function () {
  pageModifications.unregister(processNotifications);
  styleElement.remove();
  fetchedPosts = {};
};
