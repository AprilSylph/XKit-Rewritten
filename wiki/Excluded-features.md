Some XKit 7 extensions will not be implemented as features in XKit Rewritten. Their titles, and the rationale to exclude them, are listed here.

---

## Blacklist
> Clean your dash

This XKit 7 extension allowed you to block posts based on the terms specified in the extension's settings. However, it has been superceded by Tumblr's own blocking features:
- [Post content filtering](https://tumblr.zendesk.com/hc/articles/360046752174-Post-content-filtering)
- [Tag filtering](https://tumblr.zendesk.com/hc/articles/115015814708-Tag-filtering), which also checks the original post's tags
- [Blocking users](https://tumblr.zendesk.com/hc/articles/231877648-Blocking-users), which now also hides posts on your dashboard if you've blocked the original post author

## Blog Tracker
> Track people like tags

This XKit 7 extension added a sidebar section to pages with a list of user-specified blogs, and an unread count on each one. Since the creation of this extension, Tumblr has added the ability to subscribe to blogs, which provides push notifications for new posts (on mobile) and creates a dedicated "[Your Blog Subscriptions](https://www.tumblr.com/timeline/blog_subscriptions)" timeline on the new web client. Alternatively, it is possible to use an RSS reader client, such as [Mozilla Thunderbird](https://www.thunderbird.net/), to subscribe to public blogs' RSS feeds (available via adding `/rss` to the end of a Tumblr URL, e.g. `https://april.tumblr.com/rss`).

## Bookmarker
> Dashboard Time Machine

This XKit 7 extension added a bookmark button to posts and a sidebar section which allowed skipping to that post again on your dashboard. However, it never worked perfectly due to Tumblr's issues with dashboard pagination over long stretches of time, and Tumblr has since implemented a ["Now, where were we?" button](https://changes.tumblr.com/post/625181787053867008/friday-july-31st-2020) for short-term place-keeping.

## Post Archiver
> Never lose a post again.

This XKit 7 extension saved entire posts to the browser addon's storage to be viewed again later. However, saving such potentially massive amounts of data is better suited to services designed to do so, such as [Pocket](https://getpocket.com/).

## Reblog Display Options
> Adds different styles to the new reblog layout, including the "classic" nested look.

This XKit 7 extension's main use, as suggested by its description, was to revert the look of the reblog trail to the forum-like blockquotes-within-blockquotes style. The difficulty of maintaining such a feature to work with Tumblr's Neue Post Format (where all post media exists inside the reblog trail, not on top of it) far outweighs the actual value provided by such a feature, which is assumed to be primarily, if not exclusively, nostalgia value.

## Separator
> Where were we again?

This XKit 7 extension's behaviour was essentially built into the new Tumblr dashboard on [Friday, November 13th, 2020](https://changes.tumblr.com/post/634699268683448320/friday-november-13th-2020).

## Themes
> Themes for your dashboard

This XKit 7 extension provided several dashboard-wide restyles. However, the themes themselves received very little maintenance, and theming the dashboard ultimately became more difficult on Tumblr's React-based web client, since it uses obfuscated classnames on elements.

## Unreverse
> Places the post buttons on top

This XKit 7 extension existed purely for nostalgia value, and was never truly supported.
