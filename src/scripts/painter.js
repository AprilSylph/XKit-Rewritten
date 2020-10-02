(function () {
  let ownColour;
  let originalColour;
  let reblogColour;
  let likedColour;
  let tagColour;
  let colouredTags;
  let colourSourceTags;

  const excludeClass = 'xkit-painter-done';

  const paint = async function () {
    const { getPostElements } = await fakeImport('/src/util/interface.js');
    const { timelineObject } = await fakeImport('/src/util/react_props.js');
    const { apiFetch } = await fakeImport('/src/util/tumblr_helpers.js');
    const tagArray = colouredTags.split(',').map(tag => tag.trim().replace(/#/g, '').toLowerCase());

    getPostElements({ excludeClass }).forEach(async postElement => {
      const { canDelete, liked, rebloggedFromId, rebloggedRootId, rebloggedRootUuid, tags } = await timelineObject(postElement.dataset.id);

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

      if (tagColour) {
        let tagColourFound = false;
        for (const tag of tags) {
          if (tagArray.includes(tag.toLowerCase())) {
            coloursToApply.push(tagColour);
            tagColourFound = true;
            break;
          }
        }
        if (!tagColourFound && colourSourceTags) {
          try {
            const sourcePost = await apiFetch(`/v2/blog/${rebloggedRootUuid}/posts?id=${rebloggedRootId}`);
            for (const sourceTag of sourcePost.response.posts[0].tags) {
              if (tagArray.includes(sourceTag.toLowerCase())) {
                coloursToApply.push(tagColour);
                break;
              }
            }
          } catch (e) {
            // The source post can't be found, so we can't extract tags from it either.
            // This means we don't have to do anything else with it, and we can quit quietly.
          }
        }
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

  const strip = function () {
    $(`.${excludeClass} article`)
    .css('border-top', '')
    .css('border-image-source', '')
    .css('border-image-slice', '');
    $(`.${excludeClass}`).removeClass(excludeClass);
  };

  const main = async function () {
    const { getPreferences } = await fakeImport('/src/util/preferences.js');
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');

    ({ ownColour, originalColour, reblogColour, likedColour, tagColour, colouredTags, colourSourceTags } = await getPreferences('painter'));

    onNewPosts.addListener(paint);
    paint();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(paint);
    strip();
  };

  return { main, clean, autoRestart: true };
})();
