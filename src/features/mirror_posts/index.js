import { dom } from '../../utils/dom.js';
import { registerMeatballItem, unregisterMeatballItem } from '../../utils/meatballs.js';
import { showModal, modalCancelButton } from '../../utils/modals.js';

const meatballButtonId = 'mirror_posts';
const meatballButtonLabel = 'Mirror this post';

const archiveDotOrgForm = dom('form', {
  method: 'post',
  action: 'https://web.archive.org/save',
  target: '_blank',
  tabindex: -1,
}, null, [
  dom('input', { hidden: true, name: 'url_preload', type: 'text' }),
  dom('button', { class: 'blue', type: 'submit' }, null, ['Wayback Machine']),
]);

const onButtonClicked = async function ({ currentTarget }) {
  const { postUrl } = currentTarget.__timelineObjectData;
  const ampUrl = `${postUrl}/amp`;

  const archiveTodayButton = dom(
    'button',
    { class: 'blue' },
    { click: () => window.open(`https://archive.today/?run=1&url=${encodeURIComponent(ampUrl)}`, '_blank') },
    ['archive.today'],
  );

  archiveDotOrgForm.elements.url_preload.value = ampUrl;

  showModal({
    title: meatballButtonLabel,
    message: ['Note: this will not work for dashboard-only blogs.'],
    buttons: [modalCancelButton, archiveDotOrgForm, archiveTodayButton],
  });
};

export const main = async () => registerMeatballItem({ id: meatballButtonId, label: meatballButtonLabel, onclick: onButtonClicked });
export const clean = async () => unregisterMeatballItem(meatballButtonId);
