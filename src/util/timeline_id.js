const createSelector = (...components) => `:is(${components.filter(Boolean).join(', ')})`;

const anyBlog = '[a-z0-9-]{1,32}';
const anySegment = '[^/]+';

const timelineAttrs = {
  following: '/v2/timeline/dashboard',

  prefixForYou: '/v2/tabs/for_you', // '/v2/tabs/for_you?notes_info=false&reblog_info=true'
  yourTags: '/v2/timeline/hubs',
  trending: '/v2/timeline?which=trending',

  blogSubs: '/v2/timeline?which=blog_subscriptions',
  popularReblogs: '/v2/timeline?which=popular_reblogs',
  favs: '/v2/timeline?which=crushes',
  whatYouMissed: '/v2/timeline?which=what_you_missed',
  tumblrTv: '/v2/tumblr_tv',

  staffPicks: '/v2/radar/timeline',
  answerTime: '/v2/answertime/explore',
  search: '/v2/timeline/search',
  tag: (tag = anySegment) => `/v2/hubs/${tag}/timeline`,

  queue: (blog = anyBlog) => `/v2/blog/${blog}/posts/queue`,
  drafts: (blog = anyBlog) => `/v2/blog/${blog}/posts/draft`,

  channelPosts: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio
  peepr: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio

  inbox: '/v2/user/inbox',
  likes: 'v2/user/likes'
};

const patioTimelineAttrs = {
  following: '/v2/timeline/dashboard',
  prefixForYou: '/v2/tabs/for_you', // '/v2/tabs/for_you?&reblog_info=true'
  yourTags: '/v2/timeline/hubs',
  trending: '/v2/explore/trending',

  staffPicks: '/v2/radar/timeline',
  answerTime: '/v2/answertime/explore',
  search: '/v2/timeline/search',
  tag: (tag = anySegment) => `/v2/hubs/${tag}/timeline`,
  blog: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio
  drafts: (blog = anyBlog) => `/v2/blog/${blog}/posts/draft`,
  queue: (blog = anyBlog) => `/v2/blog/${blog}/posts/queue`,
  inbox: '/v2/user/inbox',
  // collection: '', ??
  likes: 'v2/user/likes'
};

const timelineIds = {
  following: '/dashboard/following',
  forYou: '/dashboard/stuff_for_you',
  yourTags: '/dashboard/hubs',
  trending: '/dashboard/trending',

  blogSubs: '/dashboard/blog_subs',
  popularReblogs: '/dashboard/popular_reblogs',
  favs: '/dashboard/crushes',
  whatYouMissed: '/dashboard/wym',
  tumblrTv: '/dashboard/tumblr_tv',

  channelPosts: (blog = anyBlog) => `blog-view-${blog}`,
  peepr: (blog = anyBlog) =>
    `peepr-posts-${blog}-undefined-undefined-undefined-undefined-undefined-undefined`,

  community: name => `communities-${name}-recent`
};

// currently may match other stuff (blog matches peepr, including posts)
// todo: update when staff adds patio- prefix
// do not use without fixing this
const patioIds = {
  prefixFollowing: 'following-',
  prefixForYou: 'for-you-',
  prefixYourTags: 'your-tags-',
  prefixTrending: 'trending-',

  prefixStaffPicks: 'staff-picks-',
  prefixAnswerTime: 'answer-time-',
  prefixSearch: 'search-',
  prefixTag: 'tag-',
  prefixBlog: 'blog-',
  prefixDrafts: 'drafts-',
  prefixQueue: 'queue-',
  prefixInbox: 'inbox-',
  prefixCollection: 'collection-',
  prefixLikes: 'likes-'
};

export const followingTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline === timelineAttrs.following ||
  timeline === patioTimelineAttrs.following ||
  timelineId === timelineIds.following ||
  timelineId?.startsWith(patioIds.prefixFollowing);

export const followingTimelineSelector = createSelector(
  `[data-timeline="${timelineAttrs.following}"]`,
  `[data-timeline="${patioTimelineAttrs.following}"]`,
  `[data-timeline-id="${timelineIds.following}"]`,
  `[data-timeline-id^="${patioIds.prefixFollowing}"]`
);

// currently includes "channel" (it is hard to not include until timeline is fully removed)
export const anyBlogTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(timelineAttrs.peepr()) ||
  timeline?.match(timelineAttrs.channelPosts()) ||
  timeline?.match(patioTimelineAttrs.blog()) ||
  timelineId?.match(timelineIds.peepr()) ||
  timelineId?.match(timelineIds.channelPosts()) ||
  timelineId?.startsWith(patioIds.prefixBlog);

// currently includes "channel" (it is hard to not include until timeline is fully removed)
export const blogTimelineFilter = blog =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === timelineAttrs.peepr(blog) ||
    timeline === timelineAttrs.channelPosts(blog) ||
    timeline === patioTimelineAttrs.blog(blog) ||
    timelineId === timelineIds.peepr(blog) ||
    timelineId === timelineIds.channelPosts(blog) ||
    (timelineId?.startsWith(patioIds.prefixBlog) && timelineId?.endsWith(`-${blog}`)); // partially functional

export const blogSubsTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline === timelineAttrs.blogSubs || timelineId === timelineIds.blogSubs;

export const anyDraftsTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(timelineAttrs.drafts()) ||
  timeline?.match(patioTimelineAttrs.drafts()) ||
  // timelineId === timelineIds.drafts ||
  timelineId?.startsWith(patioIds.prefixDrafts);

export const anyQueueTimelineFilter = ({ dataset: { timeline, timelineId } }) =>
  timeline?.match(timelineAttrs.queue()) ||
  timeline?.match(patioTimelineAttrs.queue()) ||
  // timelineId === timelineIds.queue ||
  timelineId?.startsWith(patioIds.prefixQueue);

export const tagTimelineFilter = tag =>
  ({ dataset: { timeline, timelineId } }) =>
    timeline === timelineAttrs.tag(tag) ||
    timeline === patioTimelineAttrs.tag(tag) ||
    timelineId === timelineIds.tag(tag) ||
    (timelineId?.startsWith(patioIds.prefixTag) && timelineId?.endsWith(`-${tag}-recent`)); // no idea if this works
