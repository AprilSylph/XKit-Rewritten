(function () {
  let myBlog;
  const excludeClass = 'xkit-mutual-checker-done';
  let postAttributionSel;
  let mutuals = {};
  let icon = '<svg class="xkit-mutual-icon" fill="var(--black)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M593 500q0-45-22.5-64.5T500 416t-66.5 19-18.5 65 18.5 64.5T500 583t70.5-19 22.5-64zm-90 167q-44 0-83.5 18.5t-63 51T333 808v25h334v-25q0-39-22-71.5t-59.5-51T503 667zM166 168l14-90h558l12-78H180q-8 0-51 63l-42 63v209q-19 3-52 3t-33-3q-1 1 0 27 3 53 0 53l32-2q35-1 53 2v258H2l-3 40q-2 41 3 41 42 0 64-1 7-1 21 1v246h756q25 0 42-13 14-10 22-27 5-13 8-28l1-13V275q0-47-3-63-5-24-22.5-34T832 168H166zm667 752H167V754q17 0 38.5-6.5T241 730q16-12 16-26 0-21-33-28-19-4-57-4-3 0-1-51 2-37 1-36V421q88 0 90-48 1-20-33-30-24-6-57-6-4 0-2-44l2-43h635q14 0 22.5 11t8.5 26v543q0 5 4 26 5 30 5 42 1 22-9 22z"/></svg>';
  const aprilFoolsIcon = '<svg class="xkit-mutual-icon" fill="#00b8ff"  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="M858 352q-6-14-8-35-2-12-4-38-3-38-6-54-7-28-22-43t-43-22q-16-3-54-6-26-2-38-4-21-2-34.5-8T619 124q-9-7-28-24-29-25-44-34-24-16-47-16t-47 16q-15 9-44 34-19 17-28 24-16 12-29.5 18t-34.5 8q-12 2-38 4-38 3-54 6-28 7-43 22t-22 43q-3 16-6 54-2 26-4 38-2 21-8 34.5T124 381q-7 9-24 28-25 29-34 44-16 24-16 47t16 47q9 15 34 44 17 19 24 28 12 16 18 29.5t8 34.5q2 12 4 38 3 38 6 54 7 28 22 43t43 22q16 3 54 6 26 2 38 4 21 2 34.5 8t29.5 18q9 7 28 24 29 25 44 34 24 16 47 16t47-16q15-9 44-34 19-17 28-24 16-12 29.5-18t34.5-8q12-2 38-4 38-3 54-6 28-7 43-22t22-43q3-16 6-54 2-26 4-38 2-21 8-34.5t18-29.5q7-9 24-28 25-29 34-44 16-24 16-47t-16-47q-9-15-34-44-17-19-24-28-12-16-18-29zm-119 62L550 706q-10 17-26.5 27T488 745l-11 1q-34 0-59-24L271 584q-26-25-27-60.5t23.5-61.5 60.5-27.5 62 23.5l71 67 132-204q20-30 55-38t65 11.5 37.5 54.5-11.5 65z"/></svg>';

  const addIcons = async function () {
    const { getPostElements } = await fakeImport('/src/util/interface.js');
    getPostElements({ excludeClass, noPeepr: true, includeFiltered: true }).forEach(async postElement => {
      const $link = $(postElement).find(postAttributionSel);
      const blogName = $link.text();
      if (blogName.length) {
        check($link, blogName);
      }
    });
  };

  const removeIcons = function () {
    $(`.${excludeClass}`)
    .removeClass(excludeClass)
    .removeClass('from-mutual');
    $('.xkit-mutual-icon').remove();
  };

  const check = async function ($link, blogName) {
    if (typeof mutuals[blogName] === 'undefined') {
      mutuals[blogName] = isFollowedBy(myBlog, blogName)
      .catch(() => Promise.resolve(false));
    }
    mutuals[blogName].then(isMutual => {
      if (isMutual) {
        addIcon($link);
      }
    });
  };

  const isFollowedBy = async function (blogIdentifier, query) {
    const { apiFetch } = await fakeImport('/src/util/tumblr_helpers.js');
    const { response: { followedBy } } = await apiFetch(`/v2/blog/${blogIdentifier}/followed_by`, { method: 'GET', queryParams: { query } });
    return followedBy;
  };

  const addIcon = function ($link) {
    $link.closest('[data-id]').addClass('from-mutual');
    $link.before(icon);
  };

  const main = async function () {
    mutuals = {};
    const { fetchDefaultBlog } = await fakeImport('/src/util/user_blogs.js');
    myBlog = (await fetchDefaultBlog()).name;

    const { keyToCss } = await fakeImport('/src/util/css_map.js');
    postAttributionSel = await keyToCss('postAttribution');

    const today = new Date();
    if (today.getMonth() === 3 && today.getDate() === 1) {
      icon = aprilFoolsIcon;
    }

    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.addListener(addIcons);
    addIcons();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(addIcons);

    removeIcons();
  };

  return { main, clean, stylesheet: true };
})();
