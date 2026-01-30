const createSelector = (...components) => `:is(${components.filter(Boolean).join(', ')})`;

export const timelineSelector = ':is([data-timeline], [data-timeline-id])';

const startsWith = string => `^${string}`;
const exactly = string => `^${string}$`;

const anyBlogName = '[a-z0-9-]{1,32}';
const uuidV4 = '[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}';

const peeprPostsTimelineId = ({ blogName, postId, postRole, searchMode, searchTerm, postType, tag }) =>
  `peepr-posts-${blogName}-${postId}-${postRole}-${searchMode}-${searchTerm}-${postType}-${tag}`;

export const followingTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline === '/v2/timeline/dashboard' ||
  timelineId === '/dashboard/following' ||
  timelineId?.startsWith('following-');

export const followingTimelineSelector = createSelector(
  `[data-timeline="${'/v2/timeline/dashboard'}"]`,
  `[data-timeline-id="${'/dashboard/following'}"]`,
  `[data-timeline-id^="${'following-'}"]`,
);

export const forYouTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.startsWith('/v2/tabs/for_you') ||
  timelineId === '/dashboard/stuff_for_you' ||
  timelineId?.startsWith('for-you-');

// Matches the given blog's timelines, including subpages such as drafts or in-blog searches.
export const blogTimelineFilter = blogName =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline?.match(startsWith(`/v2/blog/${blogName}/posts`)) ||
    timeline?.match(startsWith(`/v2/user/inbox/${blogName}`)) ||
    timelineId?.match(startsWith(`peepr-posts-${blogName}-`)) ||
    timelineId?.match(startsWith(`blog-view-${blogName}`)) ||
    timelineId?.match(startsWith(`drafts-${blogName}`)) ||
    timelineId?.match(startsWith(`blog-${uuidV4}-${blogName}`)) ||
    timelineId?.match(startsWith(`drafts-${uuidV4}-${blogName}`)) ||
    timelineId?.match(startsWith(`queue-${uuidV4}-${blogName}`));

// Matches any blog's timelines, including subpages such as drafts or in-blog searches.
export const anyBlogTimelineFilter = blogTimelineFilter(anyBlogName);

// Matches the given blog's posts timeline, not including subpages such as drafts or in-blog searches.
export const blogPostsTimelineFilter = blogName =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline?.match(exactly(`/v2/blog/${blogName}/posts`)) ||
    timelineId?.match(exactly(peeprPostsTimelineId({ blogName }))) ||
    timelineId?.match(exactly(`blog-view-${blogName}`)) ||
    timelineId?.match(exactly(`blog-${uuidV4}-${blogName}`));

// Matches any blog's main posts timeline, not including subpages such as drafts or in-blog searches.
export const anyBlogPostsTimelineFilter = blogPostsTimelineFilter(anyBlogName);

export const blogSubsTimelineFilter = ({ dataset: { timeline, which, timelineId } }) =>
  timeline === '/v2/timeline?which=blog_subscriptions' ||
  which === 'blog_subscriptions' ||
  timelineId === '/dashboard/blog_subs';

export const anyDraftsTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlogName}/posts/draft`)) ||
  timelineId?.match(exactly(`drafts-${anyBlogName}`)) ||
  timelineId?.match(exactly(`drafts-${uuidV4}-${anyBlogName}`));

export const anyQueueTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(exactly(`/v2/blog/${anyBlogName}/posts/queue`)) ||
  timelineId?.match(exactly(`queue-${uuidV4}-${anyBlogName}`));

export const tagTimelineFilter = tag =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === `/v2/hubs/${encodeURIComponent(tag)}/timeline` ||
    timelineId?.startsWith(`hubsTimeline-${tag}-recent-`) ||
    timelineId?.match(exactly(`tag-${uuidV4}-${tag}-recent`));

export const anyCommunityTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timelineId?.match(exactly(`communities-${anyBlogName}-recent`)) ||
  timelineId?.match(exactly(`community-${uuidV4}-${anyBlogName}`));

export const communitiesTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timelineId === 'communities-for_you';
