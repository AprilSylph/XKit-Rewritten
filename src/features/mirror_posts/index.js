import { disableWhileProcessing } from '../../utils/disable_while_processing.js';
import { button, form, input } from '../../utils/dom.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, modalCompleteButton, withErrorModal } from '../../utils/modals.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';

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

const modalProps = { title: 'Can’t mirror this post!', buttons: [modalCompleteButton] };

/** @type {(event: PointerEvent) => void} */
async function onButtonClicked ({ currentTarget }) {
  const { blog, community, postUrl } = currentTarget.__timelineObjectData;

  const ownerIsLoggedInOnlyBlog = !community && !!blog.isHiddenFromBlogNetwork;
  const ownerIsPasswordProtectedBlog = !community && !!blog.isPasswordProtected;
  const ownerIsPrivateCommunity = !!community && community.visibility !== 'public';

  if (ownerIsLoggedInOnlyBlog || ownerIsPasswordProtectedBlog) {
    showModal({ ...modalProps, message: ['This blog’s privacy settings do not allow archiving.'] });
    return;
  }

  if (ownerIsPrivateCommunity) {
    showModal({ ...modalProps, message: ['This community’s privacy settings do not allow archiving.'] });
    return;
  }

  // `blog.isHiddenFromBlogNetwork` is only defined in the blog view; if we're somewhere else, we need to fetch it.
  if (!community && blog.isHiddenFromBlogNetwork === undefined) {
    const { response } = await disableWhileProcessing(currentTarget, apiFetch(`/v2/blog/${blog.uuid}/info?fields[blogs]=?is_hidden_from_blog_network`));
    if (response.blog.isHiddenFromBlogNetwork) {
      showModal({ ...modalProps, message: ['This blog’s privacy settings do not allow archiving.'] });
      return;
    }
  }

  waybackMachineForm.elements.url_preload.value = postUrl;
  waybackMachineForm.requestSubmit();
}

export const main = async () => registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: withErrorModal(onButtonClicked) });
export const clean = async () => unregisterMeatballItem(meatballButtonId);
