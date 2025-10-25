import { keyToCss } from '../../utils/css_map.js';
import { a, button, span, link } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';

const noteCountClass = 'xkit-classic-footer-note-count';
const reblogLinkClass = 'xkit-classic-footer-reblog-link';

const postOrRadarSelector = `:is(${postSelector}, aside ${keyToCss('radar')})`;
const postOwnerControlsSelector = `${postOrRadarSelector} ${keyToCss('postOwnerControls')}`;
const footerContentSelector = `${postOrRadarSelector} article footer ${keyToCss('footerContent')}`;
const engagementControlsSelector = `${footerContentSelector} ${keyToCss('engagementControls')}`;
const replyButtonSelector = `${engagementControlsSelector} button:has(svg use[href="#managed-icon__ds-reply-outline-24"])`;
const reblogButtonSelector = `${engagementControlsSelector} button:has(svg use:is([href="#managed-icon__ds-reblog-24"], [href="#managed-icon__ds-queue-add-24"]))`;
const quickActionsSelector = 'svg[style="--icon-color-primary: var(--brand-blue);"], svg[style="--icon-color-primary: var(--brand-purple);"]';
const closeNotesButtonSelector = `${postOrRadarSelector} ${keyToCss('postActivity')} [role="tablist"] button:has(svg use[href="#managed-icon__ds-ui-x-20"])`;
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

  @container (width: 260px) {
    .${noteCountClass}, .${reblogLinkClass} {
      padding: 6px;
    }
  }

  span:has(svg[style="--icon-color-primary: var(--brand-green);"]) > .${reblogLinkClass} {
    color: var(--brand-green);
  }
  span:has(${quickActionsSelector}) > .${reblogLinkClass} {
    display: none;
  }

  .${reblogLinkClass} ~ :is(${reblogButtonSelector}):not(:has(${quickActionsSelector})) {
    display: none;
  }
  body:has(.${reblogLinkClass}) > ${reblogMenuPortalSelector}:not(:has([role="menu"][aria-labelledby])) {
    display: none;
  }
`);

const onNoteCountClick = (event) => {
  event.stopPropagation();
  const postElement = event.currentTarget.closest(postOrRadarSelector);
  const closeNotesButton = postElement?.querySelector(closeNotesButtonSelector);

  closeNotesButton
    ? closeNotesButton.click()
    : postElement?.querySelector(replyButtonSelector)?.click();
};

const processPosts = (postElements) => postElements.forEach(async postElement => {
  postElement.querySelector(`.${noteCountClass}`)?.remove();

  const { noteCount } = await timelineObject(postElement);
  const noteCountButton = button({ class: noteCountClass, click: onNoteCountClick }, [
    span({}, [noteCountFormat.format(noteCount)]), ` ${noteCount === 1 ? 'note' : 'notes'}`
  ]);

  const engagementControls = postElement.querySelector(engagementControlsSelector);
  engagementControls?.before(noteCountButton);
});

const getReblogMenuItem = async (reblogButton, href) => {
  const reblogMenuItemSelector = `${reblogMenuPortalSelector} a[href^="${href}"]`;

  return document.querySelector(reblogMenuItemSelector) ?? new Promise(resolve => {
    // Start observing the document body for the relevant reblog menu.
    const mutationObserver = new MutationObserver(mutations => {
      const addedNodes = mutations.flatMap(({ addedNodes }) => [...addedNodes]);
      const addedElements = addedNodes.filter(addedNode => addedNode instanceof Element);

      for (const addedElement of addedElements) {
        const reblogMenuItem = addedElement.querySelector(reblogMenuItemSelector);
        if (reblogMenuItem) resolve(reblogMenuItem);
      }
    });
    mutationObserver.observe(document.body, { childList: true });

    // Open the reblog menu for the observer to find.
    reblogButton.click();

    // Disconnect the observer after 5 seconds. If we've gone this long without
    // finding the menu item, anything we do cannot be considered to have been
    // triggered by user input, so we should give up and do nothing at all.
    setTimeout(() => mutationObserver.disconnect(), 5000);
  });
};

const onReblogLinkClick = (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

  event.preventDefault();

  const reblogButton = event.currentTarget.parentElement.querySelector(reblogButtonSelector);
  const href = event.currentTarget.getAttribute('href');

  getReblogMenuItem(reblogButton, href).then(reblogMenuItem => reblogMenuItem.click());
};

const processReblogButtons = (reblogButtons) => reblogButtons.forEach(async reblogButton => {
  const { blogName, canReblog, idString, reblogKey } = await timelineObject(reblogButton);

  if (reblogButton.matches(`.${reblogLinkClass} ~ :scope`)) {
    $(reblogButton).siblings(`.${reblogLinkClass}`).remove();
  }

  if (!canReblog) return;

  const styleContent = `${reblogMenuPortalSelector}:has([aria-labelledby="${reblogButton.id}"]) { display: none; }`;

  const reblogLink = a({
    'aria-label': reblogButton.getAttribute('aria-label'),
    class: reblogLinkClass,
    click: onReblogLinkClick,
    href: `/reblog/${blogName}/${idString}/${reblogKey}`
  }, [
    link({ rel: 'stylesheet', class: 'xkit', href: `data:text/css,${encodeURIComponent(styleContent)}` }),
    reblogButton.firstElementChild.cloneNode(true)]
  );

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
  pageModifications.register(`${postOrRadarSelector} article`, processPosts);

  const { noReblogMenu } = await getPreferences('classic_footer');
  if (noReblogMenu) pageModifications.register(reblogButtonSelector, processReblogButtons);
};

export const clean = async function () {
  pageModifications.unregister(processPosts);
  $(`.${noteCountClass}`).remove();

  restoreReblogButtons();
};
