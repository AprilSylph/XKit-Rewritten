import { CustomElement, fetchStyleSheets } from '../../../action/components/index.js';

const localName = 'mute-muted-users-management';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <h3>Muted blogs:</h3>
    <ul id="muted-blogs"></ul>
    <div id="no-muted-blogs">
      <em>
        No muted blogs! Use the <strong>⋯</strong> meatballs menu on any post to mute the blog that posted it.
      </em>
    </div>
    <template id="muted-blog">
      <li class="muted-blog">
        <a target="_blank"></a>
        <select>
          <option value="all">All Posts</option>
          <option value="original">Original Posts</option>
          <option value="reblogged">Reblogged Posts</option>
        </select>
        <button type="button" data-post-id="" title="Unmute">
          <!-- https://mozilla.org/MPL/2.0/ | https://github.com/FirefoxUX/acorn-icons/blob/a0be4e8/icons/desktop/16/svg/delete-16.svg -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="var(--icon-color-critical)" aria-hidden="true">
            <path d="M7 12.5H5.5v-6H7zm3.5 0H9v-6h1.5z" />
            <path d="M9.5 0a2 2 0 0 1 2 2v1H15v1.5h-1V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.5H1V3h3.5V2a2 2 0 0 1 2-2zm-6 14a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V4.5h-9zm3-12.5A.5.5 0 0 0 6 2v1h4V2a.5.5 0 0 0-.5-.5z" />
          </svg>
        </button>
      </li>
    </template>
    <template id="unmute-template">
      <dialog id="unmute-dialog">
        <h3 id="unmute-heading">Unmute <span id="unmute-blogname"></span>?</h3>
        <p>Posts by this user will appear again.</p>
        <fieldset>
          <button type="button" id="unmute-cancel">Cancel</button>
          <button type="button" id="unmute-confirm" class="destructive">Unmute</button>
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

const blogNamesStorageKey = 'mute.blogNames';
const mutedBlogsEntriesStorageKey = 'mute.mutedBlogEntries';

class MuteMutedUsersElement extends CustomElement {
  /** @type {HTMLUListElement}    */ #mutedBlogList;
  /** @type {HTMLTemplateElement} */ #mutedBlogTemplate;
  /** @type {HTMLTemplateElement} */ #unmuteTemplate;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#mutedBlogList = this.shadowRoot.getElementById('muted-blogs');
    this.#mutedBlogTemplate = this.shadowRoot.getElementById('muted-blog');
    this.#unmuteTemplate = this.shadowRoot.getElementById('unmute-template');
  }

  getBlogNames = async () => {
    const { [blogNamesStorageKey]: blogNames = {} } = await browser.storage.local.get(blogNamesStorageKey);
    return blogNames;
  };

  getMutedBlogs = async () => {
    const { [mutedBlogsEntriesStorageKey]: mutedBlogsEntries } = await browser.storage.local.get(mutedBlogsEntriesStorageKey);
    return Object.fromEntries(mutedBlogsEntries ?? []);
  };

  setMutedBlogs = mutedBlogs =>
    browser.storage.local.set({ [mutedBlogsEntriesStorageKey]: Object.entries(mutedBlogs) });

  /** @type {(event: PointerEvent) => Promise<void>} */
  onUnmuteButtonClick = async ({ currentTarget }) => {
    const mutedBlogs = await this.getMutedBlogs();
    const blogNames = await this.getBlogNames();

    const { uuid } = currentTarget.closest('li').dataset;

    const unmuteTemplateClone = this.#unmuteTemplate.content.cloneNode(true);

    const unmuteDialog = unmuteTemplateClone.getElementById('unmute-dialog');
    const unmuteBlognameDisplay = unmuteTemplateClone.getElementById('unmute-blogname');
    const unmuteCancelButton = unmuteTemplateClone.getElementById('unmute-cancel');
    const unmuteConfirmButton = unmuteTemplateClone.getElementById('unmute-confirm');

    unmuteBlognameDisplay.textContent = blogNames[uuid];

    unmuteDialog.addEventListener('close', () => unmuteDialog.remove());
    unmuteCancelButton.addEventListener('click', () => unmuteDialog.close());
    unmuteConfirmButton.addEventListener('click', async () => {
      delete mutedBlogs[uuid];
      this.setMutedBlogs(mutedBlogs);
      unmuteDialog.close();
    });

    this.shadowRoot.append(unmuteDialog);
    unmuteDialog.showModal();
  };

  updateMode = async ({ currentTarget }) => {
    const mutedBlogs = await this.getMutedBlogs();

    const { uuid } = currentTarget.closest('li').dataset;
    const { value } = currentTarget;

    mutedBlogs[uuid] = value;
    this.setMutedBlogs(mutedBlogs);
  };

  renderMutedBlogs = async () => {
    const mutedBlogs = await this.getMutedBlogs();
    const blogNames = await this.getBlogNames();

    this.#mutedBlogList.replaceChildren(...Object.entries(mutedBlogs).map(([uuid, mode]) => {
      const templateClone = this.#mutedBlogTemplate.content.cloneNode(true);
      const li = templateClone.querySelector('li');
      const linkElement = templateClone.querySelector('a');
      const modeSelect = templateClone.querySelector('select');
      const unmuteButton = templateClone.querySelector('button');

      li.dataset.uuid = uuid;

      linkElement.textContent = blogNames[uuid] ?? uuid;
      linkElement.href = `https://www.tumblr.com/blog/view/${uuid}`;

      modeSelect.value = mode;
      modeSelect.addEventListener('change', this.updateMode);

      unmuteButton.addEventListener('click', this.onUnmuteButtonClick);

      return templateClone;
    }));
  };

  onStorageChanged = changes => {
    if (
      Object.keys(changes).includes(mutedBlogsEntriesStorageKey) ||
      Object.keys(changes).includes(blogNamesStorageKey)
    ) {
      this.renderMutedBlogs();
    }
  };

  connectedCallback () {
    this.ariaLabel ||= 'Manage muted users';
    this.role ||= 'listitem';
    this.slot ||= 'preferences';

    browser.storage.local.onChanged.addListener(this.onStorageChanged);
    this.renderMutedBlogs();
  }
}

customElements.define(localName, MuteMutedUsersElement);

export default () => document.createElement(localName);
