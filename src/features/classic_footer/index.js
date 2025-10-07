import { keyToCss } from '../../utils/css_map.js';
import { dom } from '../../utils/dom.js';
import { buildStyle, filterPostElements, postSelector } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';

const noteCountClass = 'xkit-classic-footer-note-count';
const footerContentSelector = `${postSelector} article footer ${keyToCss('footerContent')}`;
const replyButtonSelector = `${footerContentSelector} button${keyToCss('engagementAction')}:has(svg use[href="#managed-icon__ds-reply-outline-24"])`;

const locale = document.documentElement.lang;
const noteCountFormat = new Intl.NumberFormat(locale);

export const styleElement = buildStyle(`
  ${postSelector} article footer {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  ${footerContentSelector} {
    justify-content: flex-end;
    gap: 0;
  }
  ${footerContentSelector} > div {
    display: contents;
  }
  ${footerContentSelector} > div:not(${keyToCss('engagementControls')}) > * {
    position: static;
    order: -1;
  }

  ${footerContentSelector} ${keyToCss('targetWrapperFlex')}:has(svg use[href="#managed-icon__ds-reblog-24"]) {
    flex: 0;
  }
  ${footerContentSelector} ${keyToCss('engagementCount')} {
    display: none;
  }
  .${noteCountClass} {
    padding: 8px;
    margin-inline: 8px;

    color: var(--content-fg-secondary);
    font-family: var(--font-family-modern);
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5rem;
  }
`);

const onNoteCountClick = ({ currentTarget }) => {
  const postElement = currentTarget.closest(postSelector);
  postElement?.querySelector(replyButtonSelector)?.click();
};

const processPosts = (postElements) => filterPostElements(postElements).forEach(async postElement => {
  postElement.querySelector(`.${noteCountClass}`)?.remove();

  const { noteCount } = await timelineObject(postElement);
  const noteCountButton = dom('button', { class: noteCountClass }, { click: onNoteCountClick }, [
    `${noteCountFormat.format(noteCount)} ${noteCount === 1 ? 'note' : 'notes'}`
  ]);

  const footerContent = postElement.querySelector(footerContentSelector);
  footerContent?.before(noteCountButton);
});

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${noteCountClass}`).remove();
};
