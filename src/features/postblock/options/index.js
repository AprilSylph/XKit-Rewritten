import { CustomElement, fetchStyleSheets } from '../../../action/components/index.js';

const localName = 'postblock-blocked-posts';

const templateDocument = new DOMParser().parseFromString(`
  <template id="${localName}">
    <h3 id="posts-blocked-count">Loading…</h3>
    <ul id="blocked-posts"></ul>
    <template id="blocked-post">
      <li class="blocked-post">
        <span></span>
        <button data-post-id="">Unblock</button>
      </li>
    </template>
  </template>
`, 'text/html');

const adoptedStyleSheets = await fetchStyleSheets([
  '/lib/modern-normalize.css',
  './index.css',
].map(import.meta.resolve));

const storageKey = 'postblock.blockedPostRootIDs';

class PostBlockBlockedPostsElement extends CustomElement {
  /** @type {HTMLHeadingElement}  */ #postsBlockedCount;
  /** @type {HTMLUListElement}    */ #blockedPostList;
  /** @type {HTMLTemplateElement} */ #blockedPostTemplate;

  constructor () {
    super(templateDocument, adoptedStyleSheets);

    this.#postsBlockedCount = this.shadowRoot.getElementById('posts-blocked-count');
    this.#blockedPostList = this.shadowRoot.getElementById('blocked-posts');
    this.#blockedPostTemplate = this.shadowRoot.getElementById('blocked-post');
  }

  unblockPost = async ({ currentTarget }) => {
    const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);
    await browser.storage.local.set({ [storageKey]: blockedPostRootIDs.filter(id => id !== currentTarget.dataset.postId) });
    currentTarget.remove();
  };

  renderBlockedPosts = async () => {
    const { [storageKey]: blockedPostRootIDs = [] } = await browser.storage.local.get(storageKey);

    this.#postsBlockedCount.textContent = `${blockedPostRootIDs.length} blocked ${blockedPostRootIDs.length === 1 ? 'post' : 'posts'}`;
    this.#blockedPostList.replaceChildren(...blockedPostRootIDs.map(blockedPostID => {
      const templateClone = this.#blockedPostTemplate.content.cloneNode(true);
      const spanElement = templateClone.querySelector('span');
      const unblockButton = templateClone.querySelector('button');

      spanElement.textContent = blockedPostID;
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
    this.role ||= 'listitem';
    this.slot ||= 'preferences';

    browser.storage.local.onChanged.addListener(this.onStorageChanged);
    this.renderBlockedPosts();
  }
}

customElements.define(localName, PostBlockBlockedPostsElement);

export default () => document.createElement(localName);
