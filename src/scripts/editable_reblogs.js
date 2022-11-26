import { createControlButtonTemplate, cloneControlButton } from '../util/control_buttons.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';
import { filterPostElements, postSelector } from '../util/interface.js';
import { showModal, modalCancelButton, hideModal } from '../util/modals.js';
import { onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';
import { apiFetch, navigate } from '../util/tumblr_helpers.js';
import { primaryBlogName } from '../util/user.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const symbolId = 'ri-edit-box-line';
const buttonClass = 'xkit-editable-reblogs-button';

const controlIconSelector = keyToCss('controlIcon');

let controlButtonTemplate;

// const blogPlaceholder = {
//   avatar: [{ url: 'https://assets.tumblr.com/pop/src/assets/images/avatar/anonymous_avatar_96-223fabe0.png' }],
//   name: 'anonymous'
// };

const onButtonClicked = async function ({ currentTarget: controlButton }) {
  // TODO: blog selection
  const targetBlog = primaryBlogName;

  const postElement = controlButton.closest(postSelector);

  const {
    rebloggedRootUuid,
    rebloggedRootId,
    blog,
    id,
    reblogKey,
    timestamp,
    content = [],
    layout,
    trail = [],
    shouldOpenInLegacy
  } = await timelineObject(postElement);

  try {
    const rootShouldOpenInLegacy =
      rebloggedRootUuid && rebloggedRootId
        ? (await apiFetch(`/v2/blog/${rebloggedRootUuid}/posts/${rebloggedRootId}`)).response
            .shouldOpenInLegacy
        : shouldOpenInLegacy;

    if (rootShouldOpenInLegacy) {
      await new Promise(resolve => {
        showModal({
          title: 'Note: Legacy post',
          message: [
            'The root post of this thread was originally created with the legacy post editor.',
            '\n\n',
            'On these threads, Editable Reblogs may work normally, have no effect, or require use of Trim Reblogs to completely remove the extra trail items.'
          ],
          buttons: [
            modalCancelButton,
            dom('button', { class: 'blue' }, { click: () => resolve() }, ['Continue'])
          ]
        });
      });
    }
  } catch (exception) {
    await new Promise(resolve => {
      showModal({
        title: 'Note: Possible legacy post',
        message: [
          'The root post of this thread may have been originally created with the legacy post editor.',
          '\n\n',
          'On these threads, Editable Reblogs may work normally, have no effect, or require use of Trim Reblogs to completely remove the extra trail items.'
        ],
        buttons: [
          modalCancelButton,
          dom('button', { class: 'blue' }, { click: () => resolve() }, ['Continue'])
        ]
      });
    });
  }

  showModal({
    title: 'Creating edited draft...',
    message: ['Please wait.']
  });
  const minimumTimer = sleep(500);

  const newTrailItem =
    content && content.length ? [{ blog, content, layout, post: { id, timestamp } }] : [];

  const trailWithNew = [...trail, ...newTrailItem];

  const generateEditableContent = (skipFirstFewItems = 0) => {
    const trailToInclude = trailWithNew.slice(skipFirstFewItems);
    if (trailToInclude.length === 0) {
      throw new Error('generateEditableContent error, post is too big or something');
    }

    const newContent = trailToInclude.flatMap(
      ({ blog, content, layout, post: { id, timestamp } }) => [
        {
          type: 'text',
          subtype: 'heading2',
          text: `${blog.name}:`,
          formatting: [
            { type: 'bold', start: 0, end: blog.name.length + 1 },
            {
              type: 'link',
              start: 0,
              end: blog.name.length,
              url: `tumblr.com/${blog.name}/${id}`
            }
          ]
        },
        ...content,
        { type: 'text', text: '-------------------------------------' }
      ]
    );

    // npf layout concat + block id manipulation + readmore removal goes here
    const newLayout = [];

    // if (there are too many blocks) {
    //   return generateEditableContent(skipFirstFewItems + 1)
    // }

    return { newContent, newLayout };
  };

  const { newContent, newLayout } = generateEditableContent();

  const excludeTrailItems = [...trailWithNew.keys()];

  const requestPath = `/v2/blog/${targetBlog}/posts`;
  const requestBody = {
    content: newContent,
    layout: newLayout,
    exclude_trail_items: excludeTrailItems,
    parent_post_id: id,
    parent_tumblelog_uuid: blog.uuid,
    reblog_key: reblogKey,
    state: 'draft'
  };
  try {
    const {
      meta,
      response: { displayText, id }
    } = await apiFetch(requestPath, { method: 'POST', body: requestBody });
    await minimumTimer;
    if (meta.status === 201) {
      showModal({
        title: displayText,
        message: [`will navigate to draft ${id} now`]
      });
    }
    await sleep(1500);
    hideModal();
    navigate(`/edit/${primaryBlogName}/${id}`);
  } catch (e) {
    console.log(e);
  }
};

const processPosts = postElements =>
  filterPostElements(postElements).forEach(async postElement => {
    const existingButton = postElement.querySelector(`.${buttonClass}`);
    if (existingButton !== null) {
      return;
    }

    const reblogIcon = postElement.querySelector(
      `footer ${controlIconSelector} use[href="#managed-icon__reblog"]`
    );
    console.log(reblogIcon);
    if (!reblogIcon) {
      return;
    }

    const { canReblog } = await timelineObject(postElement);
    if (!canReblog) {
      return;
    }

    const clonedControlButton = cloneControlButton(controlButtonTemplate, {
      click: onButtonClicked
    });
    const controlIcon = reblogIcon.closest(controlIconSelector);
    controlIcon.before(clonedControlButton);
  });

export const main = async function () {
  controlButtonTemplate = createControlButtonTemplate(symbolId, buttonClass);
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);
  $(`.${buttonClass}`).remove();
};
