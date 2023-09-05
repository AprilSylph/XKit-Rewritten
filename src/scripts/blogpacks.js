import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';

const storageKey = 'blogpacks.preferences.packs';
const sidebarId = 'your-blogpacks';

const getLink = (blogs) => '/timeline/blogpack?blogs=' + blogs;

const getSidebarOptions = (rows) => ({
  id: sidebarId,
  title: 'Your blogpacks',
  rows: rows.map(row => ({
    label: row.label,
    href: row.link,
    carrot: true
  }))
});

export const main = async () => {
  const { [storageKey]: blogpacks = [] } = await browser.storage.local.get(storageKey);
  if (!blogpacks) return;
  const sidebarRows = blogpacks.map(({ title, blogs }) => ({ label: title, link: getLink(blogs) }));
  addSidebarItem(getSidebarOptions(sidebarRows));
};
export const clean = async () => removeSidebarItem(sidebarId);
