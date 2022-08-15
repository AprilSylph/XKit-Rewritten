import { pageModifications } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { buildStyle, postSelector } from '../../util/interface.js';
import { timelineObject } from '../../util/react_props.js';
import { keyToCss } from '../../util/css_map.js';
import { removeDataset } from '../../util/cleanup.js';

const { lang } = document.documentElement;
const numberFormat = new Intl.NumberFormat(lang);

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
  pageModifications.unregister(formatNoteElements);
  styleElement.remove();
  removeDataset('fullNotes');
};
