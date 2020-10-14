(function () {
  const main = async function () {
    const { apiFetch } = await fakeImport('/src/util/tumblr_helpers.js');
    const { addSidebarItem } = await fakeImport('/src/util/sidebar.js');

    const { response: { tags } } = await apiFetch('/v2/user/tags');

    const sidebarItem = {
      id: 'tag-tracking-plus',
      title: 'Tracked Tags',
      items: tags.map(({ name, unreadCount }) => ({ label: name, href: `/tagged/${encodeURIComponent(name)}`, count: unreadCount ? unreadCount : undefined }) ),
    };

    addSidebarItem(sidebarItem);
  };

  const clean = async function () {
    const { removeSidebarItem } = await fakeImport('/src/util/sidebar.js');
    removeSidebarItem('tag-tracking-plus');
  };

  return { main, clean };
})();
