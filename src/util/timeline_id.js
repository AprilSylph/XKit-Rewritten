const matchesNothingRegex = '[]';
const matchesNothingCss = ':not(*)';

const createRegex = (...components) =>
  new RegExp(
    components
      .filter(Boolean)
      .map(component => `(${component})`)
      .join('|') || matchesNothingRegex
  );

const createSelector = (...components) =>
  `:is(${components.filter(Boolean).join(', ') || matchesNothingCss})`;

const anyBlog = '[a-z0-9-]{1,32}';
const anySegment = '[^/]+';

const timelineAttrs = {
  following: () => '/v2/timeline/dashboard',

  forYou: () => '/v2/tabs/for_you?notes_info=false&reblog_info=true', // ...not ideal
  yourTags: () => '/v2/timeline/hubs',
  trending: () => '/v2/timeline?which=trending',

  blogSubs: () => '/v2/timeline?which=blog_subscriptions',
  popularReblogs: () => '/v2/timeline?which=popular_reblogs',
  favs: () => '/v2/timeline?which=crushes',
  whatYouMissed: () => '/v2/timeline?which=what_you_missed',
  tumblrTv: () => '/v2/tumblr_tv',

  staffPicks: () => '/v2/radar/timeline',
  answerTime: () => '/v2/answertime/explore',
  search: () => '/v2/timeline/search',
  tag: (tag = anySegment) => `/v2/hubs/${tag}/timeline`,

  queue: (blog = anyBlog) => `/v2/blog/${blog}/posts/queue`,
  drafts: (blog = anyBlog) => `/v2/blog/${blog}/posts/draft`,

  blog: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio
  channelPosts: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio
  peepr: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio

  inbox: () => '/v2/user/inbox',
  likes: () => 'v2/user/likes'
};

const patioTimelineAttrs = {
  following: () => '/v2/timeline/dashboard',
  forYou: () => '/v2/tabs/for_you?&reblog_info=true', // ...not ideal
  yourTags: () => '/v2/timeline/hubs',
  trending: () => '/v2/explore/trending',

  staffPicks: () => '/v2/radar/timeline',
  answerTime: () => '/v2/answertime/explore',
  search: () => '/v2/timeline/search',
  tag: (tag = anySegment) => `/v2/hubs/${tag}/timeline`,
  blog: (blog = anyBlog) => `/v2/blog/${blog}/posts`, // matches "peepr", "channel", and blogs on patio
  drafts: (blog = anyBlog) => `/v2/blog/${blog}/posts/draft`,
  queue: (blog = anyBlog) => `/v2/blog/${blog}/posts/queue`,
  inbox: () => '/v2/user/inbox',
  // collection: () => '', ??
  likes: () => 'v2/user/likes'
};

const timelineIds = {
  following: () => '/dashboard/following',
  forYou: () => '/dashboard/stuff_for_you',
  yourTags: () => '/dashboard/hubs',
  trending: () => '/dashboard/trending',

  blogSubs: () => '/dashboard/blog_subs',
  popularReblogs: () => '/dashboard/popular_reblogs',
  favs: () => '/dashboard/crushes',
  whatYouMissed: () => '/dashboard/wym',
  tumblrTv: () => '/dashboard/tumblr_tv',

  channelPosts: (blog = anyBlog) => `blog-view-${blog}`,
  peepr: (blog = anyBlog) =>
    `peepr-posts-${blog}-undefined-undefined-undefined-undefined-undefined-undefined`,

  community: name => `communities-${name}-recent`
};

// currently may match other stuff (blog matches peepr, including posts)
// todo: update when staff adds patio- prefix
// do not use without fixing this
const patioIdPrefixes = {
  following: () => 'following-',
  forYou: () => 'for-you-',
  yourTags: () => 'your-tags-',
  trending: () => 'trending-',

  staffPicks: () => 'staff-picks-',
  answerTime: () => 'answer-time-',
  search: () => 'search-',
  tag: () => 'tag-',
  blog: () => 'blog-',
  drafts: () => 'drafts-',
  queue: () => 'queue-',
  inbox: () => 'inbox-',
  collection: () => 'collection-',
  likes: () => 'likes-'
};

const keys = Object.keys({
  ...timelineAttrs,
  ...patioTimelineAttrs,
  ...timelineIds,
  ...patioIdPrefixes
});

export const timelineFilters = Object.fromEntries(
  keys.map(key => [
    key,
    input => {
      const timelineRegex = createRegex(
        timelineAttrs[key] && `^${timelineAttrs[key](input)}$`,
        patioTimelineAttrs[key] && `^${patioTimelineAttrs[key](input)}$`
      );
      const timelineIdRegex = createRegex(
        timelineIds[key] && `^${timelineIds[key](input)}$`,
        patioIdPrefixes[key] && `^${patioIdPrefixes[key](input)}`
      );
      return element =>
        timelineRegex?.test(element?.dataset.timeline) ||
        timelineIdRegex?.test(element?.dataset.timelineId);
    }
  ])
);

export const timelineSelectors = Object.fromEntries(
  keys.map(key => [
    key,
    input =>
      createSelector(
        timelineAttrs[key] && `[data-timeline="${timelineAttrs[key](input)}"]`,
        patioTimelineAttrs[key] && `[data-timeline="${patioTimelineAttrs[key](input)}"]`,
        timelineIds[key] && `[data-timeline-id="${timelineIds[key](input)}"]`,
        patioIdPrefixes[key] && `[data-timeline-id^="${patioIdPrefixes[key](input)}"]`
      )
  ])
);
