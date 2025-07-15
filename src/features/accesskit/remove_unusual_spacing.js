import {
  cloneControlButton,
  createControlButtonTemplate
} from '../../utils/control_buttons.js';
import { keyToCss } from '../../utils/css_map.js';
import { buildStyle, postSelector } from '../../utils/interface.js';
import { pageModifications } from '../../utils/mutations.js';

const oldTextClass = 'accesskit-has-unusual-spacing';
const newTextClass = 'accesskit-removed-unusual-spacing';

const enableButtonClass = 'accesskit-unusual-spacing-enable-button';
const disableButtonClass = 'accesskit-unusual-spacing-disable-button';

const enableButtonTemplate = createControlButtonTemplate(
  'ri-contract-left-right-fill',
  enableButtonClass,
  'Hide unusual spacing'
);
const disableButtonTemplate = createControlButtonTemplate(
  'ri-expand-left-right-fill',
  disableButtonClass,
  'Show unusual spacing'
);

export const styleElement = buildStyle(`
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
`);

/**
 * javascript regular expressions lack \h (horizontal whitespace)
 *
 * [\s]: whitespace (includes line break characters)
 * [^\S]: not not whitespace; equivalent to [\s]
 *
 * \r\n\u2028\u2029: unambiguous line break characters
 * [^\S\r\n\u2028\u2029]: whitespace excluding those line break characters
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

    [...postContainer.querySelectorAll(keyToCss('rows'))].forEach(rowsElement => {
      let gapWithinSentenceCount = 0;

      const textBlocksToProcess = [
        ...rowsElement.querySelectorAll(keyToCss('textBlock'))
      ].filter(textBlock => {
        const count = textBlock.innerText.match(gapWithinSentence)?.length ?? 0;
        gapWithinSentenceCount += count;
        return count;
      });

      if (gapWithinSentenceCount < 3) return;

      postEdited = true;

      textBlocksToProcess.forEach(textBlock => {
        const newTextBlock = textBlock.cloneNode(true);
        newTextBlock.normalize();
        textBlock.after(newTextBlock);

        textBlock.classList.add(oldTextClass);
        newTextBlock.classList.add(newTextClass);

        const treeWalker = document.createTreeWalker(newTextBlock, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = treeWalker.nextNode())) {
          textNode.nodeValue = textNode.nodeValue.replaceAll(unusualWhitespace, ' ');
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
  pageModifications.register(
    `${postSelector} article, ${keyToCss('blockEditorContainer')} > ${keyToCss('trail')}`,
    processPostContainers
  );
};

export const clean = async () => {
  pageModifications.unregister(processPostContainers);

  $(`.${oldTextClass}`).removeClass(oldTextClass);
  $('[data-remove-unusual-spacing]').removeAttr('data-remove-unusual-spacing');
  $(`.${newTextClass}, .${enableButtonClass}, .${disableButtonClass}`).remove();
};
