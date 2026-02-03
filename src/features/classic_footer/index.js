import { keyToCss } from '../../utils/css_map.js';
import { a, button, span, link } from '../../utils/dom.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { translate } from '../../utils/language_data.js';
import { pageModifications } from '../../utils/mutations.js';
import { getPreferences } from '../../utils/preferences.js';
import { timelineObject } from '../../utils/react_props.js';

const activeAttribute = 'data-classic-footer';
const noteCountClass = 'xkit-classic-footer-note-count';
const modernStyleClass = 'xkit-classic-footer-ds-look';
const reblogLinkClass = 'xkit-classic-footer-reblog-link';

const postOrRadarSelector = `:is(${postSelector}, aside ${keyToCss('radar')})`;
const footerContentSelector = `${postOrRadarSelector} article footer ${keyToCss('footerContent')}`;
const engagementControlsSelector = `${footerContentSelector} ${keyToCss('engagementControls')}`;
const replyButtonSelector = 'button:has(svg use[href="#managed-icon__ds-reply-outline-24"])';
const reblogButtonSelector = 'button:has(svg use:is([href="#managed-icon__ds-reblog-24"], [href="#managed-icon__ds-queue-add-24"]))';
const quickActionsSelector = 'svg[style="--icon-color-primary: var(--brand-blue);"], svg[style="--icon-color-primary: var(--brand-purple);"]';
const closeNotesButtonSelector = `${postOrRadarSelector} ${keyToCss('postActivity')} [role="tablist"] button:has(svg use[href="#managed-icon__ds-ui-x-20"])`;
const reblogMenuPortalSelector = 'div[id^="portal/"]:has(div[role="menu"] a[role="menuitem"][href^="/reblog/"])';

const { lang } = document.documentElement;
const noteCountFormat = new Intl.NumberFormat(lang);

const singularTranslation = translate('%2$s note');
const pluralTranslation = new Map([
  ['en-US', '%2$s notes'],
  ['de-DE', '%2$s Anmerkungen'],
  ['fr-FR', '%2$s notes'],
  ['it-IT', '%2$s note'],
  ['tr-TR', '%2$s not'],
  ['es-ES', '%2$s notas'],
  ['ru-RU', '%2$s заметок'],
  ['pl-PL', '%2$s notek'],
  ['pt-PT', '%2$s notas'],
  ['pt-BR', '%2$s notas'],
  ['nl-NL', '%2$s notities'],
]).get(lang) ?? singularTranslation;

let noReblogMenu;
let modernButtonStyle;
let noZeroNotes;

export const styleElement = buildStyle(`
  [${activeAttribute}] ${keyToCss('postOwnerControls')} {
    position: relative;
    gap: 0;
    border-bottom-color: transparent;
  }
  [${activeAttribute}] ${keyToCss('postOwnerControls')}::after {
    position: absolute;
    bottom: -1px;
    left: 16px;
    right: 16px;

    border-bottom: 1px solid var(--content-tint-strong);
    content: '';
  }

  [${activeAttribute}] ${keyToCss('footerContent')} {
    gap: 0;
  }
  [${activeAttribute}] ${keyToCss('footerContent')} > div {
    display: contents;
  }
  [${activeAttribute}] ${keyToCss('footerContent')} > div:not(${keyToCss('engagementControls')}) > * {
    position: static;
    order: -1;
  }

  [${activeAttribute}] ${keyToCss('engagementControls')} > ${keyToCss('targetWrapperFlex')} {
    flex: 0;
  }
  [${activeAttribute}] ${keyToCss('engagementControls')} > ${keyToCss('likesControl')} {
    width: auto;
  }
  [${activeAttribute}] ${keyToCss('engagementControls')} ${keyToCss('engagementCount')} {
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
  .${noteCountClass}:focus-visible {
    outline: none;
    text-decoration: 2px solid var(--accent) underline;
  }
  .${noteCountClass}.${modernStyleClass} {
    padding-block: 10px;
    padding-inline: 14px;
    outline: 1px solid var(--content-tint-strong);
    outline-offset: -1px;
    margin-left: 8px;

    font-size: .875rem;
    font-weight: 350;
    line-height: 1.25rem;
  }
  .${noteCountClass}.${modernStyleClass} > span {
    color: var(--content-fg);
    font-weight: 500;
  }
  .${noteCountClass}.${modernStyleClass}:is(:hover, :active) {
    outline-color: var(--content-tint-heavy);
  }
  .${noteCountClass}.${modernStyleClass}:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
    text-decoration: none;
  }
  .${noteCountClass}[aria-hidden="true"] {
    visibility: hidden;
  }

  /* If fonts other than Favorit Modern are allowed to use a weight of 350, it looks really bad. */
  /* Use heavier weights to preserve the overall look when another addon is overriding the font. */
  :root[style*="--font-family-modern"] .${noteCountClass}.${modernStyleClass} {
    font-weight: normal;
  }
  :root[style*="--font-family-modern"] .${noteCountClass}.${modernStyleClass} > span {
    font-weight: bold;
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
    .${noteCountClass}.${modernStyleClass} {
      margin-left: 6px;
    }
  }

  span:has(svg[style="--icon-color-primary: var(--brand-green);"]) > .${reblogLinkClass} {
    color: var(--brand-green);
  }
  span:has(${quickActionsSelector}) > .${reblogLinkClass} {
    display: none;
  }

  .${reblogLinkClass} ~ ${reblogButtonSelector}:not(:has(${quickActionsSelector})) {
    display: none;
  }
  body:has(.${reblogLinkClass}) > ${reblogMenuPortalSelector}:not(:has([role="menu"][aria-labelledby])) {
    display: none;
  }
`);

const getTranslationTemplate = (noteCount) => {
  if (lang === 'fr-FR') {
    return noteCount > 1 ? pluralTranslation : singularTranslation;
  }

  if (lang === 'ru-RU') {
    if (noteCount % 10 === 1 && noteCount % 100 !== 11) {
      // Numbers ending in 1 (but not 11): Singular
      return singularTranslation;
    } else if (
      (noteCount % 10 >= 2 && noteCount % 10 <= 4) &&
      (noteCount % 100 < 12 || noteCount % 100 > 14)
    ) {
      // Numbers ending in 2-4 (but not 12-14): Genitive singular
      return '%2$s заметки';
    } else {
      // 11-14, and numbers ending in 0 or 5-9: Genitive plural
      return pluralTranslation;
    }
  }

  if (lang === 'pl-PL') {
    if (noteCount === 1) {
      // Polish only uses the singular case for exactly 1.
      return singularTranslation;
    } else if (
      (noteCount % 10 >= 2 && noteCount % 10 <= 4) &&
      (noteCount % 100 < 12 || noteCount % 100 > 14)
    ) {
      return '%2$s notki';
    } else {
      return pluralTranslation;
    }
  }

  return noteCount === 1 ? singularTranslation : pluralTranslation;
};

const getButtonChildren = (noteCount) => {
  const formattedNoteCount = span({}, [noteCountFormat.format(noteCount)]);

  try {
    const { prefix, suffix } = getTranslationTemplate(noteCount).match(/^(?<prefix>.*)(%2\$s)(?<suffix>.*)$/).groups;
    return [prefix, formattedNoteCount, suffix];
  } catch {
    return [formattedNoteCount, ` ${noteCount === 1 ? 'note' : 'notes'}`];
  }
};

const onNoteCountClick = (event) => {
  event.stopPropagation();
  const postElement = event.currentTarget.closest(postOrRadarSelector);
  if (!postElement) { return; }

  const closeNotesButton = postElement.querySelector(closeNotesButtonSelector);

  closeNotesButton
    ? closeNotesButton.click()
    : [...postElement.querySelectorAll(`[${activeAttribute}] ${replyButtonSelector}`)].at(-1)?.click();
};

const processPosts = (postElements) => postElements.forEach(async postElement => {
  postElement.querySelector(`.${noteCountClass}`)?.remove();
  postElement.querySelector(`.${reblogLinkClass}`)?.remove();

  const { noteCount } = await timelineObject(postElement);
  const noteCountButton = button({
    'aria-hidden': noteCount === 0 && noZeroNotes,
    class: `${noteCountClass} ${modernButtonStyle ? modernStyleClass : ''}`,
    click: onNoteCountClick,
  }, getButtonChildren(noteCount));

  const engagementControls = [...postElement.querySelectorAll(engagementControlsSelector)].at(-1);
  engagementControls?.closest('footer').setAttribute(activeAttribute, '');
  engagementControls?.before(noteCountButton);

  if (noReblogMenu) {
    processReblogButton(engagementControls?.querySelector(reblogButtonSelector));
  }
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

const processReblogButton = async reblogButton => {
  if (!reblogButton) return;

  const { blogName, canReblog, idString, reblogKey } = await timelineObject(reblogButton);
  if (!canReblog) return;

  const styleContent = `${reblogMenuPortalSelector}:has([aria-labelledby="${reblogButton.id}"]) { display: none; }`;

  const reblogLink = a({
    'aria-label': reblogButton.getAttribute('aria-label'),
    class: reblogLinkClass,
    click: onReblogLinkClick,
    href: `/reblog/${blogName}/${idString}/${reblogKey}`,
  }, [
    link({ rel: 'stylesheet', class: 'xkit', href: `data:text/css,${encodeURIComponent(styleContent)}` }),
    reblogButton.firstElementChild.cloneNode(true)],
  );

  reblogButton.before(reblogLink);
};

export const onStorageChanged = async function (changes) {
  if (Object.keys(changes).some(key => key.startsWith('classic_footer'))) {
    ({ noReblogMenu, modernButtonStyle, noZeroNotes } = await getPreferences('classic_footer'));
    pageModifications.trigger(processPosts);
  }
};

export const main = async function () {
  ({ noReblogMenu, modernButtonStyle, noZeroNotes } = await getPreferences('classic_footer'));
  pageModifications.register(`${postOrRadarSelector} article`, processPosts);
};

export const clean = async function () {
  pageModifications.unregister(processPosts);
  $(`[${activeAttribute}]`).removeAttr(activeAttribute);
  $(`.${noteCountClass}`).remove();
  $(`.${reblogLinkClass}`).remove();
};
