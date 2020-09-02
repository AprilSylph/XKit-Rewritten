(function() {
  let ownColour;
  let originalColour;
  let reblogColour;
  let likedColour;

  const paint = async function() {
    const { timelineObject } = await fakeImport('/src/util/react_props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit-painter-painted)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit-painter-painted');

      const post_id = postElement.dataset.id;
      const {canDelete, liked, rebloggedFromId} = await timelineObject(post_id);

      const coloursToApply = [];
      if (canDelete && ownColour) {
        coloursToApply.push(ownColour);
      }
      if (liked && likedColour) {
        coloursToApply.push(likedColour);
      }
      if (rebloggedFromId) {
        if (reblogColour) {
          coloursToApply.push(reblogColour);
        }
      } else if (originalColour) {
        coloursToApply.push(originalColour);
      }

      if (!coloursToApply.length) {
        return;
      }

      const step = 100 / coloursToApply.length;
      let borderImage = 'linear-gradient(to right';
      coloursToApply.forEach((colour, i) => {
        borderImage += `, ${colour} ${step * i}% ${step * (i + 1)}%`;
      });
      borderImage += ')';

      const articleElement = postElement.querySelector('article');
      articleElement.style.borderTop = '5px solid';
      articleElement.style.borderImageSource = borderImage;
      articleElement.style.borderImageSlice = 1;
    });
  };

  const strip = function() {
    $('.xkit-painter-painted article')
    .css('border-top', '')
    .css('border-image-source', '')
    .css('border-image-slice', '');
    $('.xkit-painter-painted').removeClass('xkit-painter-painted');
  };

  const fallback = function(value, fallbackValue) {
    return typeof value === undefined ? fallbackValue : value;
  };

  const onStorageChanged = function(changes, areaName) {
    const {'painter.preferences': preferences} = changes;
    if (!preferences || areaName !== 'local') {
      return;
    }

    const {newValue} = preferences;
    ownColour = fallback(newValue.own, ownColour);
    originalColour = fallback(newValue.original, originalColour);
    reblogColour = fallback(newValue.reblog, reblogColour);
    likedColour = fallback(newValue.liked, likedColour);

    strip();
    paint();
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const {'painter.preferences': preferences = {}} = await browser.storage.local.get('painter.preferences');
    ownColour = preferences.own;
    originalColour = preferences.original;
    reblogColour = preferences.reblog;
    likedColour = preferences.liked;

    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.addListener(paint);
    paint();
  };

  const clean = async function() {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(paint);
    strip();
  };

  return { main, clean };
})();
