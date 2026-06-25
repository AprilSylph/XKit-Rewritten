import { keyToCss } from './css_map.js';
import { a, div } from './dom.js';
import { buildStyle } from './interface.js';
import { translate } from './language_data.js';
import { timelineSelector } from './timeline_id.js';

const controlsClass = 'xkit-timeline-controls';
const lengthenedClass = 'xkit-timeline-controls-lengthened';

const cachedIdStringAttribute = 'xkit-timeline-controls-cached-id';

// Remove outdated elements when loading module
$(`.${controlsClass}`).remove();

const styleElement = buildStyle(`
.${lengthenedClass} {
  min-height: 100vh;
}

.${controlsClass} {
  color: var(--blog-title-color, rgb(var(--white-on-dark)));
  display: flex;
  font-weight: 700;
  margin-bottom: 20px;
}

.${controlsClass} > a {
  flex: 1;
  padding: 14px 16px;
  text-align: center;
  text-decoration: none;
  text-transform: capitalize;
  cursor: pointer;
}

.${controlsClass} > a.disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.${controlsClass} > a.active {
  box-shadow: inset 0 -3px 0 var(--blog-link-color, rgb(var(--deprecated-accent)));
  color: var(--blog-link-color, rgb(var(--deprecated-accent)));
}
`);
document.documentElement.append(styleElement);

export const timelineTabs = Object.freeze({
  registered: new Map(),

  register (options) {
    if (this.registered.has(options.id) === false) {
      this.registered.set(options.id, options);
      this.clean();
      this.process();
    }
  },

  unregister (id) {
    this.registered.delete(id);
    this.clean();
    this.process();
  },

  process () {
    [...document.querySelectorAll(timelineSelector)].forEach(async timelineElement => {
      const { dataset: { timeline, timelineId } } = timelineElement;
      const idString = timelineId
        ? `timelineId:${timelineId}`
        : timeline
          ? `timeline:${timeline}`
          : undefined;
      const cachedIdString = timelineElement.getAttribute(cachedIdStringAttribute);

      if (idString !== cachedIdString) {
        timelineElement.setAttribute(cachedIdStringAttribute, idString);
        timelineElement.querySelector(`.${controlsClass}`)?.remove();

        const controls = div({ class: controlsClass });

        const onclick = async ({ currentTarget }) => {
          const { dataset: { mode } } = currentTarget;
          if (!currentTarget.classList.contains('disabled')) {
            controls.dataset.mode = mode;

            buttons.forEach(button => button.classList.toggle('active', button.dataset.mode === mode));

            // const { [storageKey]: savedModes = {} } = await browser.storage.local.get(storageKey);
            // savedModes[location] = mode;
            // browser.storage.local.set({ [storageKey]: savedModes });
          }
        };

        const createButton = ({ id, label, shown }) =>
          a({ 'data-mode': id, click: onclick, class: shown === 'disabled' ? 'disabled' : '' }, [label]);

        const buttons = [...this.registered.values()]
          .map(({ id, timelineFilter, label }) => ({
            id,
            label,
            shown: timelineFilter(timelineElement),
          }))
          .filter(({ shown }) => shown)
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(createButton);

        if (buttons.length) {
          buttons.push(createButton({ id: '', label: translate('All posts'), shown: true }));

          // temp
          buttons.at(-1).click();

          controls.replaceChildren(...buttons);
          timelineElement.prepend(controls);

          if (!timelineElement.querySelector(keyToCss('manualPaginatorButtons'))) {
            timelineElement.classList.add(lengthenedClass);
          }

          // const { [storageKey]: savedModes = {} } = await browser.storage.local.get(storageKey);
          // const mode = savedModes[location] ?? 'on';
          // controls.dataset.showOriginals = mode;
        }
      }
    });
  },

  clean () {
    [...document.querySelectorAll(timelineSelector)].forEach(async timelineElement => {
      timelineElement.removeAttribute(cachedIdStringAttribute);
      timelineElement.querySelector(`.${controlsClass}`)?.remove();
    });
  },

});
