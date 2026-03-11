import { dom } from '../../utils/dom.js';
import { modalCompleteButton, showErrorModal, showModal } from '../../utils/modals.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { apiFetch } from '../../utils/tumblr_helpers.js';

const dateTimeFormat = new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: 'short', timeStyle: 'short' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const tableHeadingsRow = dom('tr', null, null, [
  dom('th', { scope: 'col' }, null, ['Type']),
  dom('th', { scope: 'col' }, null, ['Remaining']),
  dom('th', { scope: 'col' }, null, ['Limit']),
  dom('th', { scope: 'col' }, null, ['Next reset']),
]);

const buildLimitRow = ([type, { description, limit, remaining, resetAt }]) => dom('tr', null, null, [
  dom('td', { title: description, style: 'text-transform:capitalize' }, null, [type.replace(/[A-Z]/g, match => ` ${match}`)]),
  dom('td', { style: remaining === 0 ? 'color:rgb(var(--red))' : '' }, null, [remaining]),
  dom('td', null, null, [`/ ${limit}`]),
  dom('td', null, null, [dateTimeFormat.format(new Date(resetAt * 1000))]),
]);

const checkUserLimits = () => {
  showModal({
    title: 'Limit Checker',
    message: ['Hold on while the data is fetched...'],
  });

  return Promise.all([apiFetch('/v2/user/limits'), sleep(1000)]);
};

const showUserLimits = ([{ response: { user } }]) => showModal({
  title: 'Here is your data!',
  message: [dom('table', null, null, [tableHeadingsRow, ...Object.entries(user).map(buildLimitRow)])],
  buttons: [modalCompleteButton],
});

const sidebarOptions = {
  id: 'limit-checker',
  title: 'Limit Checker',
  rows: [{
    label: 'Check daily limits',
    onclick: () => checkUserLimits().then(showUserLimits).catch(showErrorModal),
    carrot: true,
  }],
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
