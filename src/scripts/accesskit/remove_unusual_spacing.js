/* eslint-disable no-unused-vars */
import {
  cloneControlButton,
  createControlButtonTemplate
} from '../../util/control_buttons.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle, postSelector } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const oldTextClass = 'xkit-accesskit-unusual-spacing';
const newTextClass = 'xkit-accesskit-removed-unusual-spacing';

const enableButtonClass = 'xkit-multiple-spaces-enable-button';
const disableButtonClass = 'xkit-multiple-spaces-disable-button';

const enableButtonTemplate = createControlButtonTemplate(
  'ri-contract-left-right-fill',
  enableButtonClass
);
const disableButtonTemplate = createControlButtonTemplate(
  'ri-expand-left-right-fill',
  disableButtonClass
);

const styleElement = buildStyle(`
.${newTextClass} {
  white-space: pre-line;
}

.${oldTextClass}:first-child + .${newTextClass} {
  margin-top: 8px;
}

[data-remove-multiple-spaces="on"] .${oldTextClass},
[data-remove-multiple-spaces="off"] .${newTextClass}  {
  display: none;
}

[data-remove-multiple-spaces="on"] .${enableButtonClass},
[data-remove-multiple-spaces="off"] .${disableButtonClass} {
  display: none;
}
.${disableButtonClass} svg {
  fill: rgba(var(--black));
}

/* temp */
[data-remove-multiple-spaces="on"] .${oldTextClass}, [data-remove-multiple-spaces="off"] .${newTextClass}  { background: rgba(255, 0, 0, 0.05); }
[data-remove-multiple-spaces="on"] .${newTextClass}, [data-remove-multiple-spaces="off"] .${oldTextClass}  { background: rgba(0, 255, 0, 0.05); }
`);

/*
\s            whitespace regex: [\r\n\t\f\v \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]

\r            <Carriage Return> (CR)
\n            <End of Line> (EOL, LF, NL)
\t            <Character Tabulation> (HT, TAB)
\f            <Form Feed> (FF)
\v            <Line Tabulation> (VT)
              Space (SP)
\u00a0        No-Break Space (NBSP)
\u1680        Ogham Space Mark
\u2000-\u200a En Quad, Em Quad, En Space, Em Space, Three-Per-Em Space, Four-Per-Em Space, Six-Per-Em Space, Figure Space, Punctuation Space, Thin Space, Hair Space
\u2028        Line Separator
\u2029        Paragraph Separator
\u202f        Narrow No-Break Space (NNBSP)
\u205f        Medium Mathematical Space (MMSP)
\u3000        Ideographic Space
\ufeff        Zero Width No-Break Space (BOM, ZWNBSP)
*/

const hasMultipleSpaceRegex = /[^\S\r\n\u2028\u2029]{2,}/;
const unusualSpaceRegex = /[^ \S\r\n\u2028\u2029]/g;

const addButtons = postElement => {
  const { dataset } = postElement;

  const controlsElements = [...postElement.querySelectorAll(`footer ${keyToCss('controls')}`)];
  if (!controlsElements.length) return;
  const lastControlsElement = controlsElements[controlsElements.length - 1];

  const disableControlButton = cloneControlButton(disableButtonTemplate, {
    click: () => {
      dataset.removeMultipleSpaces = 'off';
    }
  });
  const enableControlButton = cloneControlButton(enableButtonTemplate, {
    click: () => {
      dataset.removeMultipleSpaces = 'on';
    }
  });

  lastControlsElement.prepend(disableControlButton, enableControlButton);
};

const processContainers = containers =>
  containers.forEach(container => {
    let edited = false;
    [...container.querySelectorAll(keyToCss('textBlock'))].forEach(textBlock => {
      const text = textBlock.innerText;
      if (hasMultipleSpaceRegex.test(text)) {
        edited = true;

        const newTextBlock = textBlock.cloneNode(true);
        textBlock.after(newTextBlock);

        textBlock.classList.add(oldTextClass);
        newTextBlock.classList.add(newTextClass);

        const nodeIterator = document.createTreeWalker(newTextBlock, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = nodeIterator.nextNode())) {
          textNode.nodeValue = textNode.nodeValue.replaceAll(unusualSpaceRegex, ' ');
        }
      }
    });

    if (!edited) return;

    const postElement = container.closest(postSelector);
    if (postElement) {
      postElement.dataset.removeMultipleSpaces = 'on';
      addButtons(postElement);
    } else {
      container.dataset.removeMultipleSpaces = 'on';
    }
  });

export const main = async () => {
  document.documentElement.append(styleElement);

  pageModifications.register(
    `${postSelector} article, ${keyToCss('blockEditorContainer')} > ${keyToCss('trail')}`,
    processContainers
  );
};

export const clean = async () => {
  pageModifications.unregister(processContainers);
  styleElement.remove();
  $(`.${oldTextClass}`).removeClass(oldTextClass);
  $(`.${newTextClass}, .${enableButtonClass}, .${disableButtonClass}`).remove();
};
