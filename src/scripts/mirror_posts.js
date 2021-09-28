import { registerMeatballItem, unregisterMeatballItem } from '../util/meatballs.js';
import { showModal, modalCancelButton } from '../util/modals.js';
import { timelineObjectMemoized } from '../util/react_props.js';

const meatballButtonId = 'mirror_posts';
const meatballButtonLabel = 'Mirror this post';

const archiveDotOrgForm = Object.assign(document.createElement('form'), {
  method: 'post',
  action: 'https://web.archive.org/save',
  target: '_blank',
  tabindex: -1
});
const archiveDotOrgInput = Object.assign(document.createElement('input'), {
  hidden: true,
  name: 'url_preload',
  type: 'text'
});
const archiveDotOrgButton = Object.assign(document.createElement('button'), {
  className: 'blue',
  textContent: 'Wayback Machine',
  type: 'submit'
});
archiveDotOrgForm.append(archiveDotOrgInput, archiveDotOrgButton);

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const postID = postElement.dataset.id;

  const { postUrl } = await timelineObjectMemoized(postID);
  const ampUrl = `${postUrl}/amp`;

  const archiveTodayButton = Object.assign(document.createElement('button'), {
    className: 'blue',
    onclick: () => window.open(`https://archive.today/?run=1&url=${encodeURIComponent(ampUrl)}`, '_blank'),
    textContent: 'archive.today'
  });

  archiveDotOrgInput.value = ampUrl;

  showModal({
    title: meatballButtonLabel,
    message: 'Note: this will not work for dashboard-only blogs.',
    buttons: [modalCancelButton, archiveDotOrgForm, archiveTodayButton]
  });
};

export const main = async () => registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
export const clean = async () => unregisterMeatballItem(meatballButtonId);
