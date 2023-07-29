/* eslint-disable no-unused-vars */
import {
  cloneControlButton,
  createControlButtonTemplate
} from '../../util/control_buttons.js';
import { keyToCss } from '../../util/css_map.js';
import { buildStyle, postSelector } from '../../util/interface.js';
import { pageModifications } from '../../util/mutations.js';

const oldTextClass = 'accesskit-unusual-spacing';
const newTextClass = 'accesskit-removed-unusual-spacing';

const enableButtonClass = 'accesskit-unusual-spacing-enable-button';
const disableButtonClass = 'accesskit-unusual-spacing-disable-button';

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

[data-remove-unusual-spacing="on"] .${oldTextClass},
[data-remove-unusual-spacing="off"] .${newTextClass}  {
  display: none;
}

[data-remove-unusual-spacing="on"] .${enableButtonClass},
[data-remove-unusual-spacing="off"] .${disableButtonClass} {
  display: none;
}
.${disableButtonClass} svg {
  fill: rgba(var(--black));
}

/* temp */
[data-remove-unusual-spacing="on"] .${oldTextClass}, [data-remove-unusual-spacing="off"] .${newTextClass}  { background: rgba(255, 0, 0, 0.05); }
[data-remove-unusual-spacing="on"] .${newTextClass}, [data-remove-unusual-spacing="off"] .${oldTextClass}  { background: rgba(0, 255, 0, 0.05); }
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

const gapWithinSentence = /(?<=\w)[^\S\r\n\u2028\u2029]{2,}/g;
const unusualWhitespace = /[^ \S\r\n\u2028\u2029]/g;

const addButtons = postElement => {
  const { dataset } = postElement;

  const controlsElements = [...postElement.querySelectorAll(`footer ${keyToCss('controls')}`)];
  if (!controlsElements.length) return;
  const lastControlsElement = controlsElements[controlsElements.length - 1];

  const disableControlButton = cloneControlButton(disableButtonTemplate, {
    click: () => {
      dataset.removeUnusualSpacing = 'off';
    }
  });
  const enableControlButton = cloneControlButton(enableButtonTemplate, {
    click: () => {
      dataset.removeUnusualSpacing = 'on';
    }
  });

  lastControlsElement.prepend(disableControlButton, enableControlButton);
};

const processPostContainers = postContainers =>
  postContainers.forEach(postContainer => {
    let postEdited = false;

    [...postContainer.querySelectorAll(keyToCss('rows'))].forEach(rows => {
      let gapWithinSentenceCount = 0;

      const textBlocksToProcess = [...rows.querySelectorAll(keyToCss('textBlock'))].filter(
        textBlock => {
          const count = textBlock.innerText.match(gapWithinSentence)?.length ?? 0;
          gapWithinSentenceCount += count;
          return count;
        }
      );

      if (gapWithinSentenceCount < 3) return;

      postEdited = true;

      textBlocksToProcess.forEach(textBlock => {
        const newTextBlock = textBlock.cloneNode(true);
        newTextBlock.normalize();
        textBlock.after(newTextBlock);

        textBlock.classList.add(oldTextClass);
        newTextBlock.classList.add(newTextClass);

        const nodeIterator = document.createTreeWalker(newTextBlock, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = nodeIterator.nextNode())) {
          textNode.nodeValue = textNode.nodeValue.replaceAll(unusualWhitespace, ' ');

          // textNode.nodeValue = textNode.nodeValue.replaceAll('❝', '“');
          // textNode.nodeValue = textNode.nodeValue.replaceAll('❞', '”');
        }
      });
    });

    if (!postEdited) return;

    const postElement = postContainer.closest(postSelector);
    if (postElement) {
      postElement.dataset.removeUnusualSpacing = 'on';
      addButtons(postElement);
    } else {
      postContainer.dataset.removeUnusualSpacing = 'on';
    }
  });

export const main = async () => {
  document.documentElement.append(styleElement);

  pageModifications.register(
    `${postSelector} article, ${keyToCss('blockEditorContainer')} > ${keyToCss('trail')}`,
    processPostContainers
  );
};

export const clean = async () => {
  pageModifications.unregister(processPostContainers);
  styleElement.remove();
  $(`.${oldTextClass}`).removeClass(oldTextClass);
  $(`.${newTextClass}, .${enableButtonClass}, .${disableButtonClass}`).remove();
  $('[data-remove-unusual-spacing]').removeAttr('data-remove-unusual-spacing');
};
