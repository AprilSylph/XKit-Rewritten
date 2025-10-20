import { keyToCss } from '../../utils/css_map.js';
import { a, button, span } from '../../utils/dom.js';
import { buildStyle, filterPostElements, postSelector } from '../../utils/interface.js';
import { onNewPosts, pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';

const noteCountClass = 'xkit-classic-footer-note-count';
const reblogLinkClass = 'xkit-classic-footer-reblog-link';

const postOwnerControlsSelector = `${postSelector} ${keyToCss('postOwnerControls')}`;
const footerContentSelector = `${postSelector} article footer ${keyToCss('footerContent')}`;
const engagementControlsSelector = `${footerContentSelector} ${keyToCss('engagementControls')}`;
const replyButtonSelector = `${engagementControlsSelector} button:has(svg use[href="#managed-icon__ds-reply-outline-24"])`;
const reblogButtonSelector = `${engagementControlsSelector} button:has(svg use[href="#managed-icon__ds-reblog-24"])`;
const closeNotesButtonSelector = `${postSelector} ${keyToCss('postActivity')} [role="tablist"] button:has(svg use[href="#managed-icon__ds-ui-x-20"])`;
const reblogMenuPortalSelector = 'div[id^="portal/"]:has(div[role="menu"] a[role="menuitem"][href^="/reblog/"])';

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
    bottom: -1px;
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

  .${reblogLinkClass} {
    display: flex;
    padding: 8px;
    border-radius: 9999px;

    color: var(--content-fg-secondary);
  }
  @container (width: 260px) {
    .${reblogLinkClass} {
      padding: 6px;
    }
  }
  .${reblogLinkClass}:hover {
    background-color: var(--brand-green-tint);
    color: var(--brand-green);
  }
  .${reblogLinkClass}:focus-visible {
    outline: 2px solid var(--brand-green);
    outline-offset: -2px;
  }
  .${reblogLinkClass}:active {
    background-color: var(--brand-green-tint-strong);
    color: var(--brand-green);
  }
  footer:has(svg[style="--icon-color-primary: var(--brand-green);"] use[href="#managed-icon__ds-reblog-24"]) .${reblogLinkClass} {
    color: var(--brand-green);
  }

  .${reblogLinkClass} ~ :is(${reblogButtonSelector}) {
    display: none;
  }
  body:has(.${reblogLinkClass}) > ${reblogMenuPortalSelector} {
    display: none;
  }
`);

const onNoteCountClick = (event) => {
  event.stopPropagation();
  const postElement = event.currentTarget.closest(postSelector);
  const closeNotesButton = postElement?.querySelector(closeNotesButtonSelector);

  closeNotesButton
    ? closeNotesButton.click()
    : postElement?.querySelector(replyButtonSelector)?.click();
};

const processPosts = (postElements) => filterPostElements(postElements).forEach(async postElement => {
  postElement.querySelector(`.${noteCountClass}`)?.remove();

  const { noteCount } = await timelineObject(postElement);
  const noteCountButton = button({ class: noteCountClass, click: onNoteCountClick }, [
    span({}, [noteCountFormat.format(noteCount)]), ` ${noteCount === 1 ? 'note' : 'notes'}`]
  );

  const engagementControls = postElement.querySelector(engagementControlsSelector);
  engagementControls?.before(noteCountButton);
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const onReblogLinkClick = (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

  event.preventDefault();

  const reblogButton = event.currentTarget.parentElement.querySelector(reblogButtonSelector);
  const href = event.currentTarget.getAttribute('href');

  const reblogMenuItemSelector = `${reblogMenuPortalSelector} a[href="${href}"]`;
  if (document.querySelector(reblogMenuItemSelector)) {
    // Reblog menu was already open! No need to open it again.
    document.querySelector(reblogMenuItemSelector).click();
    return;
  }

  // Start looking for the reblog menu on the document body; as soon as we find it, click it and stop looking.
  const mutationObserver = new MutationObserver((mutations, observer) => {
    const addedNodes = mutations
      .flatMap(({ addedNodes }) => [...addedNodes])
      .filter(addedNode => addedNode instanceof Element && addedNode.matches(reblogMenuPortalSelector));

    for (const addedNode of addedNodes) {
      const reblogMenuItem = addedNode.querySelector(reblogMenuItemSelector);
      if (reblogMenuItem) {
        observer.disconnect();
        reblogMenuItem.click();
        break;
      }
    }
  });
  mutationObserver.observe(document.body, { childList: true });

  // Open the reblog menu for the observer to find.
  reblogButton.click();

  // If the reblog menu doesn't appear within 1 second, give up and do nothing.
  sleep(1000).then(mutationObserver.disconnect);
};

const processReblogButtons = (reblogButtons) => reblogButtons.forEach(async reblogButton => {
  const { blogName, canReblog, idString, reblogKey } = await timelineObject(reblogButton);

  if (reblogButton.matches(`.${reblogLinkClass} ~ :scope`)) {
    $(reblogButton).siblings(`.${reblogLinkClass}`).remove();
  }

  if (!canReblog) return;

  const reblogLink = a({
    'aria-label': reblogButton.getAttribute('aria-label'),
    class: reblogLinkClass,
    click: onReblogLinkClick,
    href: `/reblog/${blogName}/${idString}/${reblogKey}`
  }, [reblogButton.firstElementChild.cloneNode(true)]);

  reblogButton.before(reblogLink);
});

const restoreReblogButtons = () => {
  pageModifications.unregister(processReblogButtons);
  $(`.${reblogLinkClass}`).remove();
};

export const onStorageChanged = async function (changes) {
  const { 'classic_footer.preferences.noReblogMenu': noReblogMenuChanges } = changes;
  if (noReblogMenuChanges && noReblogMenuChanges.oldValue === undefined) return;

  const { newValue: noReblogMenu } = noReblogMenuChanges;
  noReblogMenu
    ? pageModifications.register(reblogButtonSelector, processReblogButtons)
    : restoreReblogButtons();
};

export const main = async function () {
  onNewPosts.addListener(processPosts);

  const { noReblogMenu } = await getPreferences('classic_footer');
  if (noReblogMenu) pageModifications.register(reblogButtonSelector, processReblogButtons);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${noteCountClass}`).remove();

  restoreReblogButtons();
};
