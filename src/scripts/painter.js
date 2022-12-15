import { filterPostElements } from '../util/interface.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch } from '../util/tumblr_helpers.js';
import { getPreferences } from '../util/preferences.js';
import { onNewPosts } from '../util/mutations.js';

let ownColour;
let originalColour;
let reblogColour;
let likedColour;
let legacyColour;
let tagColour;
let colouredTags;
let colourSourceTags;

let tagArray;

const excludeClass = 'xkit-painter-done';

const paint = postElements => filterPostElements(postElements, { excludeClass }).forEach(async postElement => {
  const { canDelete, liked, rebloggedFromId, rebloggedRootId, rebloggedRootUuid, isBlocksPostFormat, tags } = await timelineObject(postElement);

  const coloursToApply = [];

  if (canDelete && ownColour) coloursToApply.push(ownColour);
  if (liked && likedColour) coloursToApply.push(likedColour);
  if (rebloggedFromId && reblogColour) coloursToApply.push(reblogColour);
  if (!rebloggedFromId && originalColour) coloursToApply.push(originalColour);
  if (isBlocksPostFormat === false && legacyColour) coloursToApply.push(legacyColour);

  if (tagColour) {
    let tagColourFound = false;

    if (tags.some(tag => tagArray.includes(tag.toLowerCase()))) {
      coloursToApply.push(tagColour);
      tagColourFound = true;
    }

    if (!tagColourFound && colourSourceTags && rebloggedRootId && rebloggedRootUuid) {
      try {
        const { response: { tags: sourceTags } } = await apiFetch(`/v2/blog/${rebloggedRootUuid}/posts/${rebloggedRootId}`);
        if (sourceTags.some(tag => tagArray.includes(tag.toLowerCase()))) coloursToApply.push(tagColour);
      } catch (exception) {
        // The source post can't be found, so we can't extract tags from it either.
        // This means we don't have to do anything else with it, and we can quit quietly.
      }
    }
  }

  if (coloursToApply.length > 0) {
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
  }
});

const strip = function () {
  $(`.${excludeClass} article`)
    .css('border-top', '')
    .css('border-image-source', '')
    .css('border-image-slice', '');
  $(`.${excludeClass}`).removeClass(excludeClass);
};

export const main = async function () {
  ({
    ownColour,
    originalColour,
    reblogColour,
    likedColour,
    legacyColour,
    tagColour,
    colouredTags,
    colourSourceTags
  } = await getPreferences('painter'));

  tagArray = colouredTags
    .split(',')
    .map(tag => tag
      .trim()
      .replace(/#/g, '')
      .toLowerCase()
    );

  onNewPosts.addListener(paint);
};

export const clean = async function () {
  onNewPosts.removeListener(paint);
  strip();
};
