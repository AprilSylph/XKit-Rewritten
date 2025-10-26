import { keyToCss } from './css_map.js';
import { inject } from './inject.js';
import { buildStyle } from './interface.js';
import { pageModifications } from './mutations.js';

const mobileBadgeSelector = `header ${keyToCss('hamburger')} + ${keyToCss('notificationBadge')}`;
const hideBadgeClass = 'xkit-mobile-menu-badge-hidden';

document.documentElement.append(
  buildStyle(`.${hideBadgeClass} { transform: scale(0); }`)
);

/** @typedef {'home' | 'communities' | 'activity' | 'messages' | 'inbox' | 'account'} NotificationType */

export const mobileMenuBadgeHide = Object.freeze({
  excludedTypes: new Set(),

  /**
   * @param {NotificationType} type - Type of notification to exclude from mobile menu badge visibility
   */
  register (type) {
    this.excludedTypes.add(type);
    this.trigger();
  },

  /**
   * @param {NotificationType} type - Type of notification to stop excluding from mobile menu badge visibility
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

        const total = Object.values(countsByType).reduce((a, b) => a + b, 0);
        mobileBadge.classList[total === 0 ? 'add' : 'remove'](hideBadgeClass);
      }
    } else {
      mobileBadge.classList.remove(hideBadgeClass);
    }
  }
});

pageModifications.register(mobileBadgeSelector, () => mobileMenuBadgeHide.trigger());
setInterval(() => mobileMenuBadgeHide.trigger(), 10 * 1000);
