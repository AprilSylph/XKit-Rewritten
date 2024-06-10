const createSelector = (...components) => `:is(${components.filter(Boolean).join(', ')})`;

export const timelineSelector = ':is([data-timeline], [data-timeline-id])';

const anyBlog = '[a-z0-9-]{1,32}';

export const followingTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline === '/v2/timeline/dashboard' ||
  timelineId === '/dashboard/following';

export const followingTimelineSelector = createSelector(
  `[data-timeline="${'/v2/timeline/dashboard'}"]`,
  `[data-timeline-id="${'/dashboard/following'}"]`
);

// includes "channel" user blog view page
export const anyBlogTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(`/v2/blog/${anyBlog}/posts`) ||
  timelineId?.match(`peepr-posts-${anyBlog}-undefined-undefined-undefined-undefined-undefined-undefined`) ||
  timelineId?.match(`blog-view-${anyBlog}`);

// includes "channel" user blog view page
export const blogTimelineFilter = blog =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/blog/${blog}/posts` ||
    timelineId === `peepr-posts-${blog}-undefined-undefined-undefined-undefined-undefined-undefined` ||
    timelineId === `blog-view-${blog}`;

export const blogSubsTimelineFilter = ({ dataset: { timeline, which, timelineId } }) =>
  timeline === '/v2/timeline?which=blog_subscriptions' ||
  which === 'blog_subscriptions' ||
  timelineId === '/dashboard/blog_subs';

export const anyDraftsTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(`/v2/blog/${anyBlog}/posts/draft`);

export const anyQueueTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(`/v2/blog/${anyBlog}/posts/queue`);

export const tagTimelineFilter = encodedTag =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/hubs/${encodedTag}/timeline`;
