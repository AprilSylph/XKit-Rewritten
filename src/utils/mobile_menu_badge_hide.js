import { keyToCss } from './css_map.js';
import { inject } from './inject.js';
import { buildStyle } from './interface.js';
import { pageModifications } from './mutations.js';

const mobileBadgeSelector = `header ${keyToCss('hamburger')} + ${keyToCss('notificationBadge')}`;
const hideBadgeClass = 'xkit-hide-mobile-menu-badge';
const noTransitionClass = 'xkit-hide-mobile-menu-badge-no-transition';

// Load injected utility into module cache
inject('/main_world/unbury_mobile_badge_data.js');

document.documentElement.append(
  buildStyle(`
    .${hideBadgeClass} ${mobileBadgeSelector} {
      transform: scale(0);
    }
    .${noTransitionClass} ${mobileBadgeSelector} {
      transition: none;
    }
  `),
);

/** @typedef {'home' | 'communities' | 'activity' | 'messages' | 'inbox' | 'account'} NotificationType */

/**
 * Utilities to hide the notification badge on the menu button in the top left corner of the mobile page layout
 * if and only if it is caused by a specific type of notification.
 */
export const mobileMenuBadgeHide = Object.freeze({
  excludedTypes: new Set(),

  /**
   * @param {NotificationType} type Type of notification to exclude from mobile menu badge visibility
   */
  register (type) {
    this.excludedTypes.add(type);
    this.trigger();
  },

  /**
   * @param {NotificationType} type Type of notification to stop excluding from mobile menu badge visibility
   */
  unregister (type) {
    this.excludedTypes.delete(type);
    this.trigger();
  },

  async trigger () {
    const mobileBadge = document.querySelector(mobileBadgeSelector);
    if (!mobileBadge) return;

    if (this.excludedTypes.size) {
      const badgeData = await inject('/main_world/unbury_mobile_badge_data.js', [], mobileBadge);
      if (badgeData) {
        const countsByType = {
          home: badgeData.unseenPostCount ?? 0,
          communities: badgeData.unreadCommunityPostTotal ?? 0,
          activity: badgeData.notificationCount ?? 0,
          messages: badgeData.unreadMessagesCount ?? 0,
          inbox: badgeData.inboxCount ?? 0,
          account: badgeData.privateGroupBlogUnreadPostTotal ?? 0,
        };

        this.excludedTypes.forEach(type => { delete countsByType[type]; });

        const shouldHideBadge = Object.values(countsByType).every(value => value === 0);
        document.documentElement.classList.toggle(hideBadgeClass, shouldHideBadge);
      }
    } else {
      document.documentElement.classList.remove(hideBadgeClass);
    }
  },
});

// Resolves after (at least) one browser repaint. A single requestAnimationFrame callback is fired just before
// the currently pending frame repaint; a second will be scheduled to affect the following frame.
const waitForRender = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const onResizeIntoTabletLayout = async () => {
  document.documentElement.classList.add(noTransitionClass);

  mobileMenuBadgeHide.trigger();

  await waitForRender();
  document.documentElement.classList.remove(noTransitionClass);
};

pageModifications.register(mobileBadgeSelector, onResizeIntoTabletLayout);
setInterval(() => mobileMenuBadgeHide.trigger(), 10_000);
