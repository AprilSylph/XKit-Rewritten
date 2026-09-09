import { CustomElement, fetchStyleSheets } from '../../../action/components/index.js';

const localName = 'notificationblock-blocked-posts';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <h3 id="posts-blocked-count">Loading…</h3>
    <ul id="blocked-posts"></ul>
    <template id="blocked-post">
      <li class="blocked-post">
        <code role="presentation"><a target="_blank"></a></code>
        <button type="button" data-post-id="" title="Unblock notifications for this post">
          <!-- https://mozilla.org/MPL/2.0/ | https://github.com/FirefoxUX/acorn-icons/blob/a0be4e8/icons/desktop/16/svg/delete-16.svg -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="var(--icon-color-critical)" aria-hidden="true">
            <path d="M7 12.5H5.5v-6H7zm3.5 0H9v-6h1.5z" />
            <path d="M9.5 0a2 2 0 0 1 2 2v1H15v1.5h-1V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.5H1V3h3.5V2a2 2 0 0 1 2-2zm-6 14a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V4.5h-9zm3-12.5A.5.5 0 0 0 6 2v1h4V2a.5.5 0 0 0-.5-.5z" />
          </svg>
        </button>
      </li>
    </template>
    <template id="unblock-template">
      <dialog id="unblock-dialog">
        <h3>Unblock this post's notifications?</h3>
        <p>Notifications for post ID <code id="unblock-id" role="presentation"></code> will appear in your activity feed again.</p>
        <fieldset>
          <button type="button" id="unblock-cancel">Cancel</button>
          <button type="button" id="unblock-confirm" class="destructive">Unblock</button>
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

const storageKey = 'notificationblock.blockedPostTargetIDs';

class NotificationBlockBlockedPostsElement extends CustomElement {
  /** @type {HTMLHeadingElement}  */ #postsBlockedCount;
  /** @type {HTMLUListElement}    */ #blockedPostList;
  /** @type {HTMLTemplateElement} */ #blockedPostTemplate;
  /** @type {HTMLTemplateElement} */ #unblockTemplate;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#postsBlockedCount = this.shadowRoot.getElementById('posts-blocked-count');
    this.#blockedPostList = this.shadowRoot.getElementById('blocked-posts');
    this.#blockedPostTemplate = this.shadowRoot.getElementById('blocked-post');
    this.#unblockTemplate = this.shadowRoot.getElementById('unblock-template');
  }

  unblockPost = async ({ currentTarget }) => {
    const { postId } = currentTarget.dataset;
    if (!postId) return;

    const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);

    const unblockTemplateClone = this.#unblockTemplate.content.cloneNode(true);

    const unblockDialog = unblockTemplateClone.getElementById('unblock-dialog');
    const unblockIdDisplay = unblockTemplateClone.getElementById('unblock-id');
    const unblockCancelButton = unblockTemplateClone.getElementById('unblock-cancel');
    const unblockConfirmButton = unblockTemplateClone.getElementById('unblock-confirm');

    unblockIdDisplay.textContent = postId;

    unblockDialog.addEventListener('close', () => unblockDialog.remove());
    unblockCancelButton.addEventListener('click', () => unblockDialog.close());
    unblockConfirmButton.addEventListener('click', async () => {
      browser.storage.local.set({ [storageKey]: blockedPostTargetIDs.filter(id => id !== postId) });
      unblockDialog.close();
    });

    this.shadowRoot.append(unblockDialog);
    unblockDialog.showModal();
  };

  renderBlockedPosts = async () => {
    const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);

    this.#postsBlockedCount.textContent = `${blockedPostTargetIDs.length} ${blockedPostTargetIDs.length === 1 ? 'post' : 'posts'} with blocked notifications`;
    this.#blockedPostList.replaceChildren(...blockedPostTargetIDs.map(blockedPostID => {
      const templateClone = this.#blockedPostTemplate.content.cloneNode(true);
      const anchorElement = templateClone.querySelector('a');
      const unblockButton = templateClone.querySelector('button');

      anchorElement.textContent = blockedPostID;
      anchorElement.href = `https://www.tumblr.com/?xkit-notificationblock-open-post-id=${blockedPostID}`;
      unblockButton.dataset.postId = blockedPostID;
      unblockButton.addEventListener('click', this.unblockPost);

      return templateClone;
    }));
  };

  onStorageChanged = (changes) => {
    if (Object.keys(changes).includes(storageKey)) {
      this.renderBlockedPosts();
    }
  };

  connectedCallback () {
    this.ariaLabel ||= 'Manage posts with blocked notifications';
    this.role ||= 'listitem';
    this.slot ||= 'preferences';

    browser.storage.local.onChanged.addListener(this.onStorageChanged);
    this.renderBlockedPosts();
  }
}

customElements.define(localName, NotificationBlockBlockedPostsElement);

export default () => document.createElement(localName);
