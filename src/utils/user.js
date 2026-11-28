import { apiFetchWithRetry } from './tumblr_helpers.js';

// These paths have the same parameters as Tumblr's fetches for these resources,
// allowing browser cache hits when combined with the correct request headers.
// NOTICE: Please keep these strings up-to-date for fastest startup times!
const userInfoResource = '/v2/user/info?fields%5Bblogs%5D=%3Favatar%2Cname%2C%3Ftitle%2Curl%2C%3Fblog_view_url%2C%3Fcan_message%2C%3Fdescription%2C%3Fis_adult%2C%3Fuuid%2C%3Fis_private_channel%2C%3Fposts%2C%3Fis_group_channel%2C%3Fprimary%2C%3Fadmin%2C%3Fdrafts%2C%3Ffollowers%2C%3Fqueue%2C%3Fhas_flagged_posts%2C%3Fmessages%2C%3Fask%2C%3Fcan_submit%2C%3Fmention_key%2C%3Ftimezone_offset%2C%3Fanalytics_url%2C%3Fis_premium_partner%2C%3Fis_blogless_advertiser%2C%3Fis_tumblrpay_onboarded%2C%3Ftheme%2C%3Ftumblrmart_orders';
const communitiesResource = '/v2/communities?mine=1';

// Using `Cache-Control: max-age=N` as a request header allows us to specify to Firefox what should count as
// fresh in the cache for that request only, ignoring the response's cache-related headers (or lack thereof).
// This doesn't work on Chromium, where the same header can only tighten the scope of what to consider fresh.
const options = { cache: 'default', headers: { 'Cache-Control': 'max-age=60' } };

const [
  fetchedUserInfo,
  fetchedCommunitiesInfo,
] = await Promise.all([
  apiFetchWithRetry(userInfoResource, options).catch((error) => {
    console.error(error);
    return { response: {} };
  }),
  apiFetchWithRetry(communitiesResource, options).catch((error) => {
    console.error(error);
    return { response: [] };
  }),
]);

/**
 * The contents of the `/v2/user/info` API endpoint
 * @type {object | undefined}
 */
export const userInfo = fetchedUserInfo.response.user;

/**
 * An array of blog objects the current user is a member of
 * @type {object[]}
 */
export const userBlogs = userInfo?.blogs ?? [];

/**
 * An array of blog names the current user is a member of
 * @type {string[]}
 */
export const userBlogNames = userBlogs.map(blog => blog.name);

/**
 * The primary ("main") blog for the user
 */
export const primaryBlog = userBlogs.find(blog => blog.primary === true);

/**
 * The name of the user's primary ("main") blog
 * @type {string | undefined}
 */
export const primaryBlogName = primaryBlog?.name;

/**
 * An array of blog objects the current user is an admin of
 */
export const adminBlogs = userBlogs?.filter(blog => blog.admin) ?? [];

/**
 * An array of blog names the current user is admin of
 * @type {string[]}
 */
export const adminBlogNames = adminBlogs.map(blog => blog.name);

let communitiesOrder = [];
try {
  communitiesOrder = JSON.parse(localStorage.getItem('sortableCommunitiesOrder')) ?? [];
} catch {}

const getOrder = community => {
  const index = communitiesOrder.indexOf(community.name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

/**
 * An array of community objects the current user has joined
 * @type {object[]}
 */
export const joinedCommunities = [...fetchedCommunitiesInfo.response].sort((a, b) => getOrder(a) - getOrder(b));

/**
 * An array of community UUIDs the current user has joined
 * @type {string[]}
 */
export const joinedCommunityUuids = joinedCommunities.map(community => community.uuid);
