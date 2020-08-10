(function() {
  let ownColour;
  let originalColour;
  let reblogColour;
  let likedColour;

  const paint = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit_painter_painted)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_painter_painted');

      const post_id = postElement.dataset.id;
      const { canDelete, liked, rebloggedFromId } = await timelineObject(post_id);

      let coloursToApply = [];
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
      } else {
        if (likedColour) {
          coloursToApply.push(originalColour);
        }
      }

      if (!coloursToApply.length) {
        return;
      }

      const step = 100/coloursToApply.length;
      let borderImage = 'linear-gradient(to right';
      for (let i = 0; i < coloursToApply.length; i++) {
        borderImage += `, ${coloursToApply[i]} ${step*i}% ${step*(i+1)}%`;
      }
      borderImage += ')';

      const articleElement = postElement.querySelector('article');
      articleElement.style.borderTop = '5px solid';
      articleElement.style.borderImageSource = borderImage;
      articleElement.style.borderImageSlice = 1;
    });
  }

  const main = async function() {
    const {'painter.preferences': preferences = {}} = await browser.storage.local.get('painter.preferences');
    ownColour = preferences.own;
    originalColour = preferences.original;
    reblogColour = preferences.reblog;
    likedColour = preferences.liked;

    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.addListener(paint);
    paint();
  }

  const clean = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(paint);
    $('.xkit_painter_painted article').css('border-top', '').css('border-image-source', '').css('border-image-slice', '');
    $('.xkit_painter_painted').removeClass('xkit_painter_painted');
  }

  const stylesheet = '/src/scripts/painter.css';

  return { main, clean, stylesheet };
})();
