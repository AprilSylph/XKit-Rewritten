import { pageModifications } from '../../util/mutations.js';
import { translate, languageData } from '../../util/language_data.js';
import { buildStyle, postSelector } from '../../util/interface.js';
import { timelineObject } from '../../util/react_props.js';
import { keyToCss } from '../../util/css_map.js';

const createNumberFormat = async () => {
  const { code } = await languageData;
  const locale = code.replaceAll('_', '-');
  return new Intl.NumberFormat(locale);
};

const numberFormat = await createNumberFormat().catch(() => new Intl.NumberFormat());

const notes = translate('notes');
const note = translate('note');

const styleElement = buildStyle(`
  [data-full-notes] {
    font-size: 0px;
  }

  [data-full-notes]::after {
    content: attr(data-full-notes);
    font-size: 1rem;
  }
`);

const formatNoteElements = function (noteElements) {
  noteElements.forEach(async noteElement => {
    const postElement = noteElement.closest(postSelector) ?? noteElement.closest('article');
    const { noteCount } = await timelineObject(postElement);
    if (!noteCount) return;

    const label = noteCount === 1 ? note : notes;
    noteElement.dataset.fullNotes = `${numberFormat.format(noteCount)} ${label}`;
  });
};

export const main = async function () {
  document.head.append(styleElement);
  pageModifications.register(`article footer ${keyToCss('noteCountContainer')} > span`, formatNoteElements);
};

export const clean = async function () {
  styleElement.remove();
  pageModifications.unregister(formatNoteElements);
  $('[data-full-notes]').removeAttr('data-full-notes');
};
