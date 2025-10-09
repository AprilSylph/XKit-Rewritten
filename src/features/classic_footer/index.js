import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle, filterPostElements, postSelector } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const noteCountClass = 'xkit-classic-footer-note-count';

const postOwnerControlsSelector = `${postSelector} ${keyToCss('postOwnerControls')}`;
const footerContentSelector = `${postSelector} article footer ${keyToCss('footerContent')}`;
const engagementControlsSelector = `${footerContentSelector} ${keyToCss('engagementControls')}`;
const replyButtonSelector = `${engagementControlsSelector} button:has(svg use[href="#managed-icon__ds-reply-outline-24"])`;
const closeNotesButtonSelector = `${postSelector} ${keyToCss('postActivity')} [role="tablist"] button:has(svg use[href="#managed-icon__ds-ui-x-20"])`;

const locale = document.documentElement.lang;
const noteCountFormat = new Intl.NumberFormat(locale);

export const styleElement = buildStyle(`
  ${postOwnerControlsSelector} {
    position: relative;
    gap: 0;
    border-bottom-color: transparent;
  }
  ${postOwnerControlsSelector}::after {
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;

    border-bottom: 1px solid var(--content-tint-strong);
    content: '';
  }

  ${footerContentSelector} {
    gap: 0;
  }
  ${footerContentSelector} > div {
    display: contents;
  }
  ${footerContentSelector} > div:not(${keyToCss('engagementControls')}) > * {
    position: static;
    order: -1;
  }

  ${engagementControlsSelector} > ${keyToCss('targetWrapperFlex')} {
    flex: 0;
  }
  ${engagementControlsSelector} > ${keyToCss('likesControl')} {
    width: auto;
  }
  ${engagementControlsSelector} ${keyToCss('engagementCount')} {
    display: none;
  }

  .${noteCountClass} {
    order: -2;
    padding: 8px;
    border-radius: 20px;
    margin-right: auto;
    overflow: hidden;

    color: var(--content-fg-secondary);
    font-family: var(--font-family-modern);
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`);

const onNoteCountClick = ({ currentTarget }) => {
  const postElement = currentTarget.closest(postSelector);
  const closeNotesButton = postElement?.querySelector(closeNotesButtonSelector);
  closeNotesButton?.click() ?? postElement?.querySelector(replyButtonSelector)?.click();
};

const processPosts = (postElements) => filterPostElements(postElements).forEach(async postElement => {
  postElement.querySelector(`.${noteCountClass}`)?.remove();

  const { noteCount } = await timelineObject(postElement);
  const noteCountButton = dom('button', { class: noteCountClass }, { click: onNoteCountClick }, [
    `${noteCountFormat.format(noteCount)} ${noteCount === 1 ? 'note' : 'notes'}`
  ]);

  const engagementControls = postElement.querySelector(engagementControlsSelector);
  engagementControls?.before(noteCountButton);
});

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${noteCountClass}`).remove();
};
