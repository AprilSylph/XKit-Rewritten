import { CustomElement, fetchStyleSheets } from '../../../action/components/index.js';
import { Sortable } from '../../../lib/sortable.esm.js';

const localName = 'quick-tags-bundle-management';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <h3>Your tag bundles</h3>
    <ul id="bundles"></ul>
    <button type="button" id="new-bundle-button">New tag bundle…</button>
    <dialog id="new-bundle-dialog">
      <h3 id="new-bundle-heading">Create new tag bundle</h3>
      <form id="new-bundle" aria-labelledby="new-bundle-heading">
        <label for="new-bundle-title">Title</label>
        <input id="new-bundle-title" name="title" type="text" autocomplete="off" placeholder="My tag bundle" required>
        <label for="new-bundle-tags">Tags</label>
        <input id="new-bundle-tags" name="tags" type="text" autocomplete="off" placeholder="tag1, tag2, tag3" required>
        <fieldset>
          <button type="button" id="new-bundle-cancel">Cancel</button>
          <button type="submit" class="primary">Create</button>
        </fieldset>
      </form>
    </dialog>
    <template id="bundle-template">
      <li class="bundle">
        <button type="button" class="drag-handle" title="Drag to rearrange">
          <!-- https://mozilla.org/MPL/2.0/ | https://github.com/mozilla-firefox/firefox/blob/5151f62/toolkit/themes/shared/icons/move-16.svg -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M7 14H5v-2h2v2zM11 14H9v-2h2v2zM7 9H5V7h2v2zM11 9H9V7h2v2zM7 4H5V2h2v2zM11 2v2H9V2h2z"/>
          </svg>
        </button>
        <div class="text-content">
          <p class="label"></p>
          <p class="description"></p>
        </div>
        <span class="actions">
          <button type="button" class="edit" title="Edit tag bundle">
            <!-- https://mozilla.org/MPL/2.0/ | https://github.com/FirefoxUX/acorn-icons/blob/ac44bbf/icons/desktop/16/svg/edit-active-16.svg -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.118 1.47a2.605 2.605 0 0 1 3.336.296l.781.78c.962.962 1.026 2.5.141 3.537a68.5 68.5 0 0 1-7.703 7.694l-1.023.854a1.64 1.64 0 0 1-1.043.37H1.75a.75.75 0 0 1-.75-.75v-2.857c0-.376.126-.745.371-1.044a68 68 0 0 1 8.547-8.725zM8.797 4.63A67 67 0 0 0 2.53 11.3a.14.14 0 0 0-.031.094v2.108h2.107a.14.14 0 0 0 .092-.032H4.7a66.5 66.5 0 0 0 6.669-6.267zm3.597-1.803a1.106 1.106 0 0 0-1.502-.062q-.488.415-.984.856l2.47 2.47q.441-.495.857-.982c.375-.44.35-1.092-.06-1.502z" clip-rule="evenodd" />
            </svg>
          </button>
          <button type="button" class="delete" title="Delete tag bundle">
            <!-- https://mozilla.org/MPL/2.0/ | https://github.com/FirefoxUX/acorn-icons/blob/a0be4e8/icons/desktop/16/svg/delete-16.svg -->
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="var(--icon-color-critical)" aria-hidden="true">
              <path d="M7 12.5H5.5v-6H7zm3.5 0H9v-6h1.5z" />
              <path d="M9.5 0a2 2 0 0 1 2 2v1H15v1.5h-1V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.5H1V3h3.5V2a2 2 0 0 1 2-2zm-6 14a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V4.5h-9zm3-12.5A.5.5 0 0 0 6 2v1h4V2a.5.5 0 0 0-.5-.5z" />
            </svg>
          </button>
        </span>
      </li>
    </template>
    <template id="edit-template">
      <dialog id="edit-dialog">
        <h3 id="edit-heading">Edit tag bundle</h3>
        <form id="edit-form" aria-labelledby="edit-heading">
          <label for="edit-title">Title</label>
          <input id="edit-title" name="title" type="text" autocomplete="off" placeholder="My tag bundle" required>
          <label for="edit-tags">Tags</label>
          <input id="edit-tags" name="tags" type="text" autocomplete="off" placeholder="tag1, tag2, tag3" required>
          <fieldset>
            <button type="button" id="edit-cancel">Cancel</button>
            <button type="submit" class="primary">Save</button>
          </fieldset>
        </form>
      </dialog>
    </template>
    <template id="delete-template">
      <dialog id="delete-dialog">
        <h3 id="delete-heading">Delete tag bundle?</h3>
        <p>This tag bundle will be deleted:</p>
        <ul>
          <li><strong>Title</strong>: <span id="delete-title"></span></li>
          <li><strong>Tags</strong>: <span id="delete-tags"></span></li>
        </ul>
        <fieldset>
          <button type="button" id="delete-cancel">Cancel</button>
          <button type="button" id="delete-confirm" class="destructive">Delete</button>
        </fieldset>
      </dialog>
    </template>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  '/action/acorn.css',
  './index.css',
].map(import.meta.resolve));

/**
 * @typedef TagBundle
 * @property {string} title The display name of this tag bundle.
 * @property {string} tags  The tags in this tag bundle (comma-separated).
 */

const storageKey = 'quick_tags.preferences.tagBundles';

class QuickTagsBundleManagementElement extends CustomElement {
  /** @type {HTMLUListElement}    */ #bundlesList;
  /** @type {HTMLTemplateElement} */ #bundleTemplate;

  /** @type {HTMLButtonElement}   */ #newBundleButton;
  /** @type {HTMLButtonElement}   */ #newBundleCancelButton;
  /** @type {HTMLDialogElement}   */ #newBundleDialog;
  /** @type {HTMLFormElement}     */ #newBundleForm;

  /** @type {HTMLTemplateElement} */ #editTemplate;
  /** @type {HTMLTemplateElement} */ #deleteTemplate;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#bundlesList = this.shadowRoot.getElementById('bundles');
    this.#bundleTemplate = this.shadowRoot.getElementById('bundle-template');

    this.#newBundleButton = this.shadowRoot.getElementById('new-bundle-button');
    this.#newBundleCancelButton = this.shadowRoot.getElementById('new-bundle-cancel');
    this.#newBundleDialog = this.shadowRoot.getElementById('new-bundle-dialog');
    this.#newBundleForm = this.shadowRoot.getElementById('new-bundle');

    this.#editTemplate = this.shadowRoot.getElementById('edit-template');
    this.#deleteTemplate = this.shadowRoot.getElementById('delete-template');
  }

  onNewBundleButtonClick = () => this.#newBundleDialog.showModal();
  onNewBundleCancelButtonClick = () => this.#newBundleDialog.close();
  onNewBundleDialogClose = () => this.#newBundleForm.reset();

  /** @type {(event: SubmitEvent) => Promise<void>} */
  onNewBundleFormSubmit = async (event) => {
    event.preventDefault();
    if (!this.#newBundleForm.reportValidity()) return;

    const { title, tags } = this.#newBundleForm.elements;
    const tagBundle = { title: title.value, tags: tags.value };

    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);
    await browser.storage.local.set({ [storageKey]: [...tagBundles, tagBundle] });

    this.#newBundleDialog.close();
  };

  /** @type {(event: PointerEvent) => Promise<void>} */
  onEditButtonClick = async ({ currentTarget }) => {
    const bundleId = currentTarget.closest('[id]')?.id;
    if (!bundleId) return;

    /** @type {{ "quick_tags.preferences.tagBundles": TagBundle[] }} */
    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

    const index = parseInt(bundleId, 10);
    const tagBundle = tagBundles[index];
    if (!tagBundle) return;

    const editTemplateClone = this.#editTemplate.content.cloneNode(true);

    const editForm = editTemplateClone.getElementById('edit-form');
    const editDialog = editTemplateClone.getElementById('edit-dialog');
    const editCancelButton = editTemplateClone.getElementById('edit-cancel');

    Object.entries(tagBundle).forEach(([key, value]) => {
      const formControlElement = editForm.elements.namedItem(key);
      if (formControlElement) formControlElement.value = value;
    });

    /** @type {(event: SubmitEvent) => Promise<void>} */
    const onEditSubmit = async (event) => {
      event.preventDefault();
      if (!editForm.reportValidity()) return;

      const formData = new FormData(editForm);
      for (const [key, value] of formData.entries()) {
        tagBundle[key] = value;
      }

      await browser.storage.local.set({ [storageKey]: tagBundles });

      editDialog.close();
    };

    editForm.addEventListener('submit', onEditSubmit);
    editDialog.addEventListener('close', () => editDialog.remove());
    editCancelButton.addEventListener('click', () => editDialog.close());

    this.shadowRoot.append(editDialog);
    editDialog.showModal();
  };

  /** @type {(event: PointerEvent) => Promise<void>} */
  onDeleteButtonClick = async ({ currentTarget }) => {
    const bundleId = currentTarget.closest('[id]')?.id;
    if (!bundleId) return;

    /** @type {{ "quick_tags.preferences.tagBundles": TagBundle[] }} */
    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

    const index = parseInt(bundleId, 10);
    const tagBundle = tagBundles[index];
    if (!tagBundle) return;

    const deleteTemplateClone = this.#deleteTemplate.content.cloneNode(true);

    const deleteDialog = deleteTemplateClone.getElementById('delete-dialog');
    const deleteTitleDisplay = deleteTemplateClone.getElementById('delete-title');
    const deleteTagsDisplay = deleteTemplateClone.getElementById('delete-tags');
    const deleteCancelButton = deleteTemplateClone.getElementById('delete-cancel');
    const deleteConfirmButton = deleteTemplateClone.getElementById('delete-confirm');

    deleteTitleDisplay.textContent = tagBundle.title;
    deleteTagsDisplay.textContent = tagBundle.tags.split(',').map(tag => `#${tag.trim()}`).join(' ');

    deleteDialog.addEventListener('close', () => deleteDialog.remove());
    deleteCancelButton.addEventListener('click', () => deleteDialog.close());
    deleteConfirmButton.addEventListener('click', async () => {
      tagBundles.splice(index, 1);
      await browser.storage.local.set({ [storageKey]: tagBundles });
      deleteDialog.close();
    });

    this.shadowRoot.append(deleteDialog);
    deleteDialog.showModal();
  };

  renderBundles = async () => {
    const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

    this.#bundlesList.replaceChildren(...tagBundles.map(({ title, tags }, index) => {
      const bundleTemplateClone = this.#bundleTemplate.content.cloneNode(true);
      bundleTemplateClone.querySelector('.bundle').id = index;

      const bundleLabel = bundleTemplateClone.querySelector('.label');
      bundleLabel.textContent = title;
      bundleLabel.title = bundleLabel.textContent;

      const bundleDescription = bundleTemplateClone.querySelector('.description');
      bundleDescription.textContent = tags.split(',').map(tag => `#${tag.trim()}`).join(' ');
      bundleDescription.title = bundleDescription.textContent;

      bundleTemplateClone.querySelector('.edit').addEventListener('click', this.onEditButtonClick);
      bundleTemplateClone.querySelector('.delete').addEventListener('click', this.onDeleteButtonClick);

      return bundleTemplateClone;
    }));
  };

  onStorageChanged = (changes) => {
    if (Object.keys(changes).includes(storageKey)) {
      this.renderBundles();
    }
  };

  connectedCallback () {
    this.ariaLabel ||= 'Manage tag bundles';
    this.role ||= 'listitem';
    this.slot ||= 'preferences';

    browser.storage.local.onChanged.addListener(this.onStorageChanged);
    this.#newBundleButton.addEventListener('click', this.onNewBundleButtonClick);
    this.#newBundleCancelButton.addEventListener('click', this.onNewBundleCancelButtonClick);
    this.#newBundleDialog.addEventListener('close', this.onNewBundleDialogClose);
    this.#newBundleForm.addEventListener('submit', this.onNewBundleFormSubmit);

    this.renderBundles();

    Sortable.create(this.#bundlesList, {
      dataIdAttr: 'id',
      handle: '.drag-handle',
      forceFallback: true,
      store: {
        set: async sortable => {
          const { [storageKey]: tagBundles = [] } = await browser.storage.local.get(storageKey);

          const order = sortable.toArray().map(Number);
          const newTagBundles = order.map(i => tagBundles[i]);

          browser.storage.local.set({ [storageKey]: newTagBundles });
        },
      },
    });
  }
}

customElements.define(localName, QuickTagsBundleManagementElement);

export default () => document.createElement(localName);
