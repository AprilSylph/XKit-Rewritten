import { button, form, input } from '../../utils/dom.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, modalCompleteButton } from '../../utils/modals.js';

const meatballButtonId = 'mirror_posts';
const meatballButtonLabel = 'Mirror this post';

const waybackMachineForm = form({
  action: 'https://web.archive.org/save',
  hidden: true,
  method: 'post',
  target: '_blank',
}, [
  input({ name: 'url_preload', type: 'text' }),
  button({ type: 'submit' }),
]);
document.documentElement.append(waybackMachineForm);

/** @type {(event: PointerEvent) => void} */
function onButtonClicked (event) {
  const { blog, community, postUrl } = event.currentTarget.__timelineObjectData;
  const isLoggedInOnly = !!blog.isHiddenFromBlogNetwork;
  const isPrivateBlog = !!blog.isPasswordProtected && !community;
  const isPrivateCommunity = !!community && community.visibility !== 'public';

  if (isLoggedInOnly || isPrivateBlog || isPrivateCommunity) {
    showModal({
      title: 'Can’t mirror this post!',
      message: [`This ${community ? 'community' : 'blog'}’s privacy settings does not allow archiving.`],
      buttons: [modalCompleteButton],
    });
    return;
  }

  waybackMachineForm.elements.url_preload.value = postUrl;
  waybackMachineForm.requestSubmit();
}

export const main = async () => registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
export const clean = async () => unregisterMeatballItem(meatballButtonId);
