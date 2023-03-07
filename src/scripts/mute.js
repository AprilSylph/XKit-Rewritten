import {
  registerBlogMeatballItem,
  registerMeatballItem,
  unregisterBlogMeatballItem,
  unregisterMeatballItem
} from '../util/meatballs.js';
import { showModal, modalCancelButton } from '../util/modals.js';

const meatballButtonId = 'mute';

const onMeatballButtonClicked = function ({ currentTarget }) {
  const name = currentTarget.__timelineObjectData?.blogName || currentTarget.__blogData?.name;

  showModal({
    title: `Mute options for ${name}:`,
    message: [],
    buttons: [modalCancelButton]
  });
};

export const main = async function () {
  registerMeatballItem({
    id: meatballButtonId,
    label: ({ blogName }) => `Mute options for ${blogName}`,
    onclick: onMeatballButtonClicked
  });

  registerBlogMeatballItem({
    id: meatballButtonId,
    label: ({ name }) => `Mute options for ${name}`,
    onclick: onMeatballButtonClicked
  });
};

export const clean = async function () {
  unregisterMeatballItem(meatballButtonId);
  unregisterBlogMeatballItem(meatballButtonId);
};
