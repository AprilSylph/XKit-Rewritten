(function () {
  const pauseGif = function (gifElement) {
    const image = new Image();
    image.src = gifElement.currentSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.className = gifElement.className;
      canvas.classList.add('xkit-paused-gif');
      canvas.style.zIndex = 1;
      canvas.getContext('2d').drawImage(image, 0, 0);

      const gifLabel = document.createElement('p');
      gifLabel.className = 'xkit-gif-label';

      gifElement.parentNode.appendChild(canvas);
      gifElement.parentNode.appendChild(gifLabel);
    };
  };

  const processGifs = function () {
    [...document.querySelectorAll('figure img[srcset*=".gif"]:not(.xkit-accesskit-disabled-gif)')]
    .forEach(gifElement => {
      gifElement.classList.add('xkit-accesskit-disabled-gif');

      if (gifElement.parentNode.querySelector('.xkit-paused-gif') !== null) {
        return;
      }

      if (gifElement.complete && gifElement.currentSrc) {
        pauseGif(gifElement);
      } else {
        gifElement.onload = () => pauseGif(gifElement);
      }
    });
  };

  const onStorageChanged = async function (changes, areaName) {
    if (areaName !== 'local') {
      return;
    }

    const {
      'accesskit.preferences.disableGifs': disableGifsChanges,
      'accesskit.preferences.blueLinks': blueLinksChanges,
      'accesskit.preferences.noUserColours': noUserColoursChanges,
    } = changes;

    if (disableGifsChanges) {
      const { onPostsMutated } = await fakeImport('/src/util/mutations.js');
      const { newValue: disableGifs } = disableGifsChanges;

      if (disableGifs) {
        onPostsMutated.addListener(processGifs);
        processGifs();
      } else {
        onPostsMutated.removeListener(processGifs);
        $('.xkit-paused-gif, .xkit-gif-label').remove();
        $('.xkit-accesskit-disabled-gif').removeClass('xkit-accesskit-disabled-gif');
      }
    }

    if (blueLinksChanges) {
      const { newValue: blueLinks } = blueLinksChanges;
      const toggle = blueLinks ? 'add' : 'remove';
      document.body.classList[toggle]('accesskit-blue-links');
    }

    if (noUserColoursChanges) {
      const { newValue: noUserColours } = noUserColoursChanges;
      const toggle = noUserColours ? 'add' : 'remove';
      document.body.classList[toggle]('accesskit-no-user-colours');
    }
  };

  const main = async function () {
    browser.storage.onChanged.addListener(onStorageChanged);
    const { getPreferences } = await fakeImport('/src/util/preferences.js');

    const { disableGifs, blueLinks, noUserColours } = await getPreferences('accesskit');

    if (disableGifs) {
      const { onPostsMutated } = await fakeImport('/src/util/mutations.js');
      onPostsMutated.addListener(processGifs);
      processGifs();
    }

    if (blueLinks) {
      document.body.classList.add('accesskit-blue-links');
    }

    if (noUserColours) {
      document.body.classList.add('accesskit-no-user-colours');
    }
  };

  const clean = async function () {
    browser.storage.onChanged.removeListener(onStorageChanged);
    const { onPostsMutated } = await fakeImport('/src/util/mutations.js');

    onPostsMutated.removeListener(processGifs);

    $('.xkit-paused-gif, .xkit-gif-label').remove();
    $('.xkit-accesskit-disabled-gif').removeClass('xkit-accesskit-disabled-gif');
    $(document.body).removeClass('accesskit-blue-links accesskit-no-user-colours');
  };

  return { main, clean, stylesheet: true };
})();
