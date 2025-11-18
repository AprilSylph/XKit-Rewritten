import { br, div, h3, input, label, style } from './dom.js';

const modalId = 'xkit-disabled-info-modal';
const dismissCheckboxId = 'xkit-disabled-info-dismiss-checkbox';

fetch(browser.runtime.getURL('/content_scripts/modals.css'))
  .then(result => result.text())
  .then(modalCssText => {
    $(`#${modalId}`).remove();

    document.getElementById('base-container')?.appendChild(
      div(
        {
          id: modalId,
          tabindex: '-1',
          role: 'dialog',
          'aria-modal': 'true',

          // prevents Tumblr's trapFocusInsideGlass function from stealing focus when opened from mobile drawer
          'data-skip-glass-focus-trap': ''
        },
        [
          style({}, [
            `
              #${dismissCheckboxId}, #${modalId}:has(> #${dismissCheckboxId}:checked) {
                display: none;
              }

              ${modalCssText
                .replaceAll('#xkit-modal ', `#${modalId} `)
                .replaceAll(':is(a, button, input)', ':is(a, button, input, label)')}
            `
          ]),
          input({ type: 'checkbox', id: dismissCheckboxId }),

          h3({ class: 'title' }, [
            'XKit Rewritten has been disabled.'
          ]),
          div({ class: 'message' }, [
            'There may be some leftover modifications visible on the page.',
            br(),
            'For best results, refresh this browser tab.'
          ]),
          div({ class: 'buttons' }, [
            label({ for: dismissCheckboxId, class: 'blue' }, ['OK'])
          ])
        ]
      )
    );
  });
