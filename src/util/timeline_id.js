const createSelector = (...components) => `:is(${components.filter(Boolean).join(', ')})`;

export const timelineSelector = ':is([data-timeline], [data-timeline-id])';

const anyBlog = '[a-z0-9-]{1,32}';

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
  timeline?.match(`/v2/blog/${anyBlog}/posts`) ||
  timelineId?.match(`peepr-posts-${anyBlog}-undefined-undefined-undefined-undefined-undefined-undefined`) ||
  timelineId?.match(`blog-view-${anyBlog}`) ||
  timelineId?.startsWith('blog-'); // partially functional

// includes "channel" user blog view page
export const blogTimelineFilter = blog =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/blog/${blog}/posts` ||
    timelineId === `peepr-posts-${blog}-undefined-undefined-undefined-undefined-undefined-undefined` ||
    timelineId === `blog-view-${blog}` ||
    (timelineId?.startsWith('blog-') && timelineId?.endsWith(`-${blog}`)); // partially functional

export const blogSubsTimelineFilter = ({ dataset: { timeline, which, timelineId } }) =>
  timeline === '/v2/timeline?which=blog_subscriptions' ||
  which === 'blog_subscriptions' ||
  timelineId === '/dashboard/blog_subs';

export const anyDraftsTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(`/v2/blog/${anyBlog}/posts/draft`) ||
  // timelineId === ???? ||
  timelineId?.startsWith('drafts-');

export const anyQueueTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(`/v2/blog/${anyBlog}/posts/queue`) ||
  // timelineId === ???? ||
  timelineId?.startsWith('queue-');

export const tagTimelineFilter = encodedTag =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/hubs/${encodedTag}/timeline` ||
    // timelineId === ??? ||
    (timelineId?.startsWith('tag-') && timelineId?.endsWith(`-${encodedTag}-recent`));
