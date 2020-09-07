(function() {
  let ownColour;
  let originalColour;
  let reblogColour;
  let likedColour;

  const paint = async function() {
    const { timelineObject } = await fakeImport('/src/util/react_props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit-painter-done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit-painter-done');

      const {canDelete, liked, rebloggedFromId} = await timelineObject(postElement.dataset.id);

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
    $('.xkit-painter-done article')
    .css('border-top', '')
    .css('border-image-source', '')
    .css('border-image-slice', '');
    $('.xkit-painter-done').removeClass('xkit-painter-done');
  };

  const onStorageChanged = async function(changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    if (Object.keys(changes).some(key => key.startsWith('painter'))) {
      const { getPreferences } = await fakeImport('/src/util/preferences.js');

      ({ownColour, originalColour, reblogColour, likedColour} = await getPreferences('painter'));

      strip();
      paint();
    }
  };

  const main = async function() {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    ({ownColour, originalColour, reblogColour, likedColour} = await getPreferences('painter'));

    onNewPosts.addListener(paint);
    paint();
  };

  const clean = async function() {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(paint);
    strip();
  };

  return { main, clean };
})();
