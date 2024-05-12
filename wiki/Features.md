XKit Rewritten is a bundled collection of scripts, none of which are enabled by default. This page details the behaviour of each one.

---

## AccessKit
> Accessibility options for Tumblr

This script is a collection of accessibility tweaks for the Tumblr dashboard. With all options disabled, it does nothing.

Available preferences:
- Toggle: **Pause GIFs until they are hovered over**
- Toggle: **De-animate the Changes/Shop/etc. links carousel**
- Toggle: **Disable layout element animations**
- Toggle: **Make links in posts blue**
- Toggle: **Remove user-set colours from text in posts**
- Toggle: **Remove user-set fonts from text in posts**
- Toggle: **Use regular-width scrollbars**
- Toggle: **Move alt text to captions below images**
- Selection: **Alt text mode**
  - Option: **Show all alt text** (default)
  - Option: **Only show image descriptions**

## Anti-Capitalism
> Hide advertisement containers

This script hides ad containers and the "Sponsored" section in the sidebar. While it *hides* ads, it does not *block* anything; it is intended to be complimentary to [Tumblr Ad-Free Browsing](https://www.tumblr.com/settings/ad-free-browsing) or a wide-spectrum blocker such as [uBlock Origin](https://github.com/gorhill/ublock#readme).

## Classic Search
> Go to tagged pages easily

This script changes the behaviour of Tumblr's search bar to go to `/tagged/` pages by default, rather than `/search/`. It does not change the behaviour of the dropdown that appears when typing, or any of its items.

Available preferences:
- Toggle: **Open tagged pages in a new tab**

## CleanFeed
> Browse safely in public

This script hides visual media (images and video) on posts until the media is hovered over.

Available preferences:
- Selection: **Hide media from:**
  - Option: **mature posts & blogs** (default)
  - Option: **all posts**
- Text field: **Treat these blogs as mature (comma-separated)**
- Text field: **Treat these tags as mature (comma-separated)**

## Collapsed Queue
> Shorten posts in your queue

This script limits the height of posts on queue pages - making the post content scrollable - to make it easier to rearrange the queue post order.

Available preferences:
- Toggle: **Run on the queue page**
- Toggle: **Run on the drafts page**

## Hide Avatars

This script makes user avatars invisible on a username basis.

Available preferences:
- Text field: **Usernames (comma-separated)**

## Limit Checker
> Check post limit and more

This script adds a button to the sidebar which, when clicked, will fetch your account's action limit data and display it to you in a table. This includes everything with a per-day per-account limit, such as new posts, new blogs, and uploaded media.

## Mass Deleter
> Delete drafts or clear your queue

This script adds a button to the sidebar on your blogs' drafts and queue pages.

On drafts pages, clicking the button will prompt you to enter a date to delete drafts up to. Once confirmed, all drafts on that blog will be gathered, and qualifying drafts will then be deleted in batches of 100.

On queue pages, clicking the button will ask to confirm that you want to clear your queue. If confirmed, all queued posts on that blog will be gathered, and then deleted in batches of 100. While scheduled posts do appear on the queue page, they are ignored.

## Mass Privater
> Unpublish posts by time range or tag

This script adds a button to the sidebar on your blogs' admin views which, when clicked, will prompt you to enter criteria for which posts you would like to make private. You can choose which blog to affect, a "before" date/time, and optionally enter tags to query by.

There is a confirmation prompt after you submit your criteria, allowing you to double-check your choices.

If confirmed, all published posts matching your criteria will be fetched via the Tumblr API, and then made private in batches of 100.

## Mass Unliker
> Clear your likes

This script adds a button to the sidebar on the Likes page which, when clicked, prompts you to clear your likes. If confirmed, all your likes will be fetched via the Tumblr API and then unliked one at a time, at a maximum rate of 1 per second.

Because the fetch process is not perfect, this utility may have to be run multiple times to truly clear an account's likes. Additionally, due to how Tumblr counts likes, you may not end up with a like count of zero, even if your likes page becomes devoid of posts.

## Mirror Posts
> Back up posts to public archives

This script adds a "Mirror this post" button to posts' meatball menus. Clicking it will open a modal which allows you to choose between backing the post up via archive.today or the WayBack Machine.

## Mutual Checker
> See who follows you back

This script adds an icon in front of the post author's username on posts if the user is both followed by you and follows your primary blog.

Available preferences:
- Toggle: **Only show posts from mutuals on the dashboard**
- Toggle: **Only show notifications from mutuals in the activity feed**

## No Recommended
> Focus only on what you follow

This script is a collection of options for removing recommended content. With all options disabled, it does nothing.

To hide posts from your followed tags, disable "Include followed tag posts" in your [dashboard settings](https://www.tumblr.com/settings/dashboard).

Available preferences:
- Toggle: **Hide experimental types of recommended posts**
- Toggle: **Hide the answertime banner**
- Toggle: **Hide recommended blogs between posts**
- Toggle: **Hide recommended tags between posts**
- Toggle: **Hide related posts in the photo lightbox**
- Toggle: **Hide recommended blogs in the sidebar**
- Toggle: **Hide recommended blogs in the blog view sidebar**
- Toggle: **Hide the Tumblr Radar**

## NotificationBlock
> Block a post's notifications

This script adds a "Block notifications" button to your posts' meatball menus. Blocking a post's notifications will hide all notifications for all instances of that post on your activity page, with no indication they were hidden. To unblock a post's notifications, find the post again and use the "Unblock notifications" meatball menu button.

## Open In Tabs
> Open links and blogs in new tabs

This script disables the on-dashboard blog view and instead opens all links that could even roughly be considered "external" in a new tab.

## Painter
> Add colour to your dashboard posts

This script adds coloured borders to posts depending on the criteria the post fits.

Available preferences:
- Colour: **Own post colour**
- Colour: **Original post colour**
- Colour: **Reblogged post colour**
- Colour: **Liked post colour**
- Colour: **Tag highlighting colour**
- Text field: **Tags to highlight (comma separated)**
- Toggle: **Also highlight for tags on source posts**

## Panorama
> Widescreen dashboard

This script changes the layout of the Tumblr web interface to fill all available horizontal space. It only takes effect on the site's desktop layout.

## PostBlock
> Disappear all instances of a post

This script adds a "Block this post" button to posts' meatball menus. Blocking a post will hide all instances of it, including reblogs, with no indication.

Available preferences:
- Embedded page: **Manage blocked posts** – Displays your blocked post IDs (listed oldest-first) with per-ID unblock buttons.

## Quick Reblog

This script adds a small post form next to reblog buttons on posts, when the reblog button is hovered over.

Available preferences:
- Selection: **Popup position**
  - Option: **Above reblog button**
  - Option: **Below reblog button** (default)
- Toggle: **Show the blog selector** – If disabled, always uses your primary blog
- Toggle: **Remember the last selected blog in the popup**
- Toggle: **Show the comment field**
- Toggle: **Enable integration with Quick Tags** – Shows tag bundle shortcuts using data from *Quick Tags*
- Toggle: **Show the tags field**
- Toggle: **Suggest tags from the post being reblogged** - If enabled, suggests tags when typing in the tags field; the post's tags, post author, original post author, and post type will be suggested
- Text field: **Reblog tag** - If set, automatically tags all posts reblogged through Quick Reblog with this tag
- Text field: **Queue tag** - If set, automatically tags all posts queued through Quick Reblog with this tag
- Toggle: **Remember which posts I've already reblogged** – If enabled, registers root post IDs when reblogging posts, and turns the reblog button green on every instance of those posts
- Selection: **Remember the last**
  - Option: **100 posts**
  - Option: **1,000 posts** (default)
  - Option: **10,000 posts**

## Quick Tags
> Add tags to posts easily

This script adds a button to your posts and the post editor which allows you to add bundles of tags in a single click.

This script requires the beta post editor to be enabled for all its features to function.

This script does not need to be enabled for *Quick Reblog* to use its data.

Available preferences:
- Text field: **Original post tag** - Set a tag to automatically add when creating a new post
- Text field: **Answer tag** - Set a tag to automatically add when answering an ask
- Toggle: **Automatically tag asker when answering**
- Embedded page: **Manage tag bundles** – Allows you to define, edit, and delete bundles of tags

## Quote Replies
> Reply to reply notifications

This script adds a button to each reply notification. When clicked, it will draft a new post quoting that reply, and then open the edit form for that draft.

Optionally, you can set the script to instead open the draft in a new tab. This requires pop-ups from Tumblr to be allowed; if a new tab cannot be opened, the script will simply give you a notification that the draft was created.

Available preferences:
- Toggle: **Automatically tag the quoted user**
- Toggle: **Open created posts in new tabs**

## Scroll to Bottom
> Load ALL the posts!

This script adds a reverse version of Tumblr's scroll to top button. Clicking it will scroll the page down until there are no more posts to load, making it easy to load all posts on queue and drafts pages, provided endless scrolling is enabled.

## Seen Posts
> Dim the posts you've seen already

This script remembers posts on the dashboard and adds a semi-transparent effect if the post has been seen before.

Available preferences:
- Toggle: **Only dim avatars on seen posts**
- Toggle: **Hide seen posts from the dashboard**

## Shorten Posts
> Limit the length of posts on your dash

This script limits the amount of vertical space that posts can each take up, and adds an "Expand" button to the bottom of shortened posts.

Available preferences:
- Toggle: **Show tags on shortened posts**
- Selection: **Maximum post height**
  - Option: **0.25x viewport height**
  - Option: **0.5x viewport height**
  - Option: **1x viewport height** (default)
  - Option: **1.5x viewport height**
  - Option: **2x viewport height**
  - Option: **4x viewport height**

## Show Originals
> Hide reblogged posts by default

This script adds controls to the top of the dashboard, the blog subscriptions timeline, and blog views which allow you to switch between viewing all posts or only original posts.

Available preferences:
- Toggle: **Always show my own reblogs**
- Toggle: **Always show reblogs with contributed content**
- Text field: **Always show reblogs from these blogs (comma-separated)**

## Tag Replacer
> Replace old tags in bulk

This script adds a button to the sidebar which, when clicked, prompts you to replace a tag on a given blog.

Only one tag can be replaced at a time. Any commas in the "remove this tag" field will be ignored.

You can specify zero, one, or more tags to replace the tag with. It is possible to replace a tag with itself. You'll be given a summary of what will happen before you give the final confirmation.

Once confirmed, all public published posts on the selected blog with the given tag will be fetched. Then, they will be processed in batches of 100 via the Mass Post Editor API. Since adding tags and deleting tags cannot be done simultaneously this way, replacing a tag will process the batch twice: first to add new tags, then to delete old tags.

## Tag Tracking+
> Unread counts on followed tags

This script lists your followed tags in the sidebar with unread counts. On `/tagged/` pages for tags you follow, it will remember the newest post it's seen and use that to determine if posts are unread, so it will be inaccurate if you are not using the "Latest" view.

Available preferences:
- Selection: **Show unread counts**
  - Option: **Both in search & sidebar** (default)
  - Option: **Only in the search dropdown**
  - Option: **Only in the sidebar**
- Toggle: **Only show tags with new posts in the sidebar**

## Themed Posts
> Use users' theme colors for posts

This script changes the palette of posts to match the blog's palette.

Available preferences:
- Toggle: **Theme every reblog trail item individually**
- Toggle: **Enable theming on the blog view**
- Text field: **Disable theming on these blogs (comma-separated)**
- Selection: **Disabled/deleted blog theming**
  - Option: **default/palette color** (default)
  - Option: **inherit reblogging blog's theme**

## TimeFormat
> Reformat Tumblr's timestamps

This script allows you to apply [Moment.js formatting](https://momentjs.com/docs/#/displaying/format/) to Tumblr's timestamps on posts, reblogs, and notes. You can enable Tumblr's timestamps in your [dashboard settings](https://www.tumblr.com/settings/dashboard).

Available preferences:
- Text field: **Format** - Moment.js formatting syntax. Uses ISO 8601 format if set to nothing.
- Toggle: **Append relative time**

## Trim Reblogs
> Trim threads after posting or drafting

This script adds a control button to your posts which allows removal of individual reblog trail items. (It does **not** appear in the editor.)

When the button is clicked, a modal is opened that lets you pick which reblog trail items to remove. It will not allow trimming if the action would result in an empty post.

Only posts stored in Tumblr's Neue Post Format (NPF) can be reliably trimmed. For the best results, the root post should be NPF, and at no point should your reblog (nor any of its ancestors in the reblog chain) have been edited using legacy methods.

All posts made from the mobile Tumblr apps since ~2018 are NPF, as are all posts made with the [new post editor on web](https://tumblr.zendesk.com/hc/en-us/articles/360010901913-Using-the-Neue-Post-Format#webnpf). All reblogs of NPF posts are NPF by default, regardless of the method used. However, _editing_ a reblog of an NPF post using Tumblr's legacy post editor, or a previous version of XKit, will result in the post being stored in the legacy post format instead. Once a reblog is stored in the legacy post format, all downstream reblogs are also legacy.

Asks can be trimmed, but trimmed asks will display incorrectly on blog themes.

## Tweaks
> Miscellaneous dashboard options

This script is a collection of options which subtly change aspects of the Tumblr interface. It does nothing if none of its preferences are enabled.

Available preferences:
- Toggle: **Restore links to individual posts in the post header**
- Toggle: **Use a slim layout for filtered posts**
- Toggle: **Highlight contributed content on reblogs**
- Toggle: **Show every line of tags by default**
- Toggle: **Turn the Changes/Shop/etc. links carousel into a separating line**
- Toggle: **Remove the coloured shadow from focused posts**
- Toggle: **Remove the sticky effect from the dashboard tab bar**
- Toggle: **Hide mini-follow buttons on posts**
- Toggle: **Hide following/mutuals indicators on notifications**
- Toggle: **Hide control button tooltips in the post footer**
- Toggle: **Hide the "blaze" and "tip" button labels**
- Toggle: **Hide filtered posts entirely**
- Toggle: **Hide my own posts on the dashboard**
- Toggle: **Hide posts that I've liked on the dashboard**
- Toggle: **Hide my follower count where possible**
- Toggle: **Hide the Home/Following unread count**
- Toggle: **Hide the Activity notification badge**
- Toggle: **Hide the "Now, where were we?" button**

## Vanilla Audio
> Use the browser's controls for audio posts

This script hides the play button on audio blocks in posts, and inserts a browser-native audio player underneath. The appearance of this player varies between browsers.

Available preferences:
- Selection: **Default Volume**
  - Option: **Muted**
  - Option: **25%**
  - Option: **50%**
  - Option: **75%**
  - Option: **100%** (default)

## Vanilla Video
> Use the browser's controls for video posts

This script hides Tumblr's video player and inserts a browser-native video player in its place, with controls shown and autoplay disabled. The appearance of this player varies between browsers.

Available preferences:
- Selection: **Default Volume**
  - Option: **Muted**
  - Option: **25%**
  - Option: **50%**
  - Option: **75%**
  - Option: **100%** (default)
