(function() {
  let blockingMode;
  let reblogSelector;

  const processPosts = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit-cleanfeed-processed)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit-cleanfeed-processed');

      if (blockingMode === 'all') {
        postElement.classList.add('xkit-cleanfeed-hidden');
        return;
      }

      const postTimelineObject = await timelineObject(postElement.dataset.id);

      {
        const {blog: {isAdult}} = postTimelineObject;
        if (isAdult) {
          postElement.classList.add('xkit-cleanfeed-hidden');
          return;
        }
      }

      const reblogs = postElement.querySelectorAll(reblogSelector);
      const {trail} = postTimelineObject;
      trail.forEach((trailItem, i) => {
        if (trailItem.blog === undefined) {
          return;
        }

        const {blog: {isAdult}} = trailItem;
        if (isAdult) {
          reblogs[i].classList.add('xkit-cleanfeed-hidden');
        }
      });
    });
  };

  const unProcessPosts = function() {
    $('.xkit-cleanfeed-processed').removeClass('xkit-cleanfeed-processed');
    $('.xkit-cleanfeed-hidden').removeClass('xkit-cleanfeed-hidden');
  };

  const onStorageChanged = function(changes, areaName) {
    const {'cleanfeed.preferences': preferences} = changes;
    if (!preferences || areaName !== 'local') {
      return;
    }

    const {newValue: {blocking_mode}} = preferences;
    blockingMode = blocking_mode;

    unProcessPosts();
    processPosts();
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { postListener } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    reblogSelector = await keyToCss('reblog');

    const {'cleanfeed.preferences': preferences = {
      blocking_mode: 'smart',
    }} = await browser.storage.local.get('cleanfeed.preferences');
    blockingMode = preferences.blocking_mode;

    postListener.addListener(processPosts);
    processPosts();
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(processPosts);
    unProcessPosts();
  };

  const stylesheet = '/src/scripts/cleanfeed.css';

  return { main, clean, stylesheet };
})();
