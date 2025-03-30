import { buildStyle, filterPostElements, getTimelineItemWrapper } from '../../utils/interface.js';
import { onNewPosts } from '../../utils/mutations.js';
import { timelineObject } from '../../utils/react_props.js';
import { forYouTimelineFilter } from '../../utils/timeline_id.js';
import { joinedCommunityUuids } from '../../utils/user.js';

const hiddenAttribute = 'data-no-recommended-community-posts-hidden';
const timeline = forYouTimelineFilter;
const includeFiltered = true;

export const styleElement = buildStyle(`[${hiddenAttribute}] {
  content: linear-gradient(transparent, transparent);
  height: 0;
}`);

const processPosts = postElements =>
  filterPostElements(postElements, { timeline, includeFiltered }).forEach(async postElement => {
    const { community } = await timelineObject(postElement);
    if (community && !joinedCommunityUuids.includes(community.uuid)) {
      getTimelineItemWrapper(postElement).setAttribute(hiddenAttribute, '');
    }
  });

export const main = async function () {
  onNewPosts.addListener(processPosts);
};

export const clean = async function () {
  onNewPosts.removeListener(processPosts);

  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
};
