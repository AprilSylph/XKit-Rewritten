const createSelector = (...components) => `:is(${components.filter(Boolean).join(', ')})`;

export const timelineSelector = ':is([data-timeline], [data-timeline-id])';

const exactly = string => `^${string}$`;
const anyBlog = '[a-z0-9-]{1,32}';
const anyPostId = '[0-9]{1,20}';
const uuidV4 = '[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}';

export const followingTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline === '/v2/timeline/dashboard' ||
  timelineId === '/dashboard/following' ||
  timelineId?.startsWith('following-');

export const followingTimelineSelector = createSelector(
  `[data-timeline="${'/v2/timeline/dashboard'}"]`,
  `[data-timeline-id="${'/dashboard/following'}"]`,
  `[data-timeline-id^="${'following-'}"]`
);

// includes "channel" user blog view page
export const anyBlogTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlog}/posts`)) ||
  timelineId?.match(exactly(`peepr-posts-${anyBlog}-undefined-undefined-undefined-undefined-undefined-undefined`)) ||
  timelineId?.match(exactly(`blog-view-${anyBlog}`)) ||
  timelineId?.match(exactly(`blog-${uuidV4}-${anyBlog}`));

// includes "channel" user blog view page
export const blogTimelineFilter = blog =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/blog/${blog}/posts` ||
    timelineId === `peepr-posts-${blog}-undefined-undefined-undefined-undefined-undefined-undefined` ||
    timelineId === `blog-view-${blog}` ||
    timelineId?.match(exactly(`blog-${uuidV4}-${blog}`));

export const anyBlogPostTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlog}/posts/${anyPostId}/permalink`)) ||
  timelineId?.match(exactly(`peepr-posts-${anyBlog}-${anyPostId}-undefined-undefined-undefined-undefined-undefined`));

// includes viewing a blog on and searching/tag searching a blog on peepr
export const anyPeeprTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timelineId?.startsWith('peepr-posts-');

// includes viewing a blog on and searching/tag searching a blog on peepr
export const peeprTimelineFilter = blog =>
  ({ dataset: { timeline, timelineId } }) =>
    timelineId?.startsWith(`peepr-posts-${blog}-`);

export const blogSubsTimelineFilter = ({ dataset: { timeline, which, timelineId } }) =>
  timeline === '/v2/timeline?which=blog_subscriptions' ||
  which === 'blog_subscriptions' ||
  timelineId === '/dashboard/blog_subs';

export const anyDraftsTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlog}/posts/draft`)) ||
  timelineId?.match(exactly(`drafts-${anyBlog}`)) ||
  timelineId?.match(exactly(`drafts-${uuidV4}-${anyBlog}`));

export const anyQueueTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlog}/posts/queue`)) ||
  timelineId?.match(exactly(`queue-${uuidV4}-${anyBlog}`));

export const anyFlaggedReviewTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlog}/posts/review`));

export const likesTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline === 'v2/user/likes' ||
  timelineId === 'likes' ||
  timelineId?.match(exactly(`likes-${uuidV4}`));

export const peeprLikesTimelineFilter = blog =>
  ({ dataset: { timeline, timelineId } }) =>
    timelineId === `peepr-likes-${blog}`;

export const anyPeeprLikesTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timelineId?.match(exactly(`peepr-likes-${anyBlog}`));

export const inboxTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.startsWith('/v2/user/inbox');

export const tagTimelineFilter = tag =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/hubs/${encodeURIComponent(tag)}/timeline` ||
    timelineId?.startsWith(`hubsTimeline-${tag}-recent-`) ||
    timelineId?.match(exactly(`tag-${uuidV4}-${tag}-recent`));

export const anyCommunityTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timelineId?.match(exactly(`communities-${anyBlog}-recent`)) ||
  timelineId?.match(exactly(`community-${uuidV4}-${anyBlog}`));

export const communitiesTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timelineId === 'communities-for_you';
