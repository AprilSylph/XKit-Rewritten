import { apiFetch } from '../util/tumblr_helpers.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { modalCompleteButton, showModal } from '../util/modals.js';
import { dom, jsx } from '../util/dom.js';

const dateTimeFormat = new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: 'short', timeStyle: 'short' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const tableHeadingsRow = dom('tr', null, null, [
  dom('th', { scope: 'col' }, null, ['Type']),
  dom('th', { scope: 'col' }, null, ['Remaining']),
  dom('th', { scope: 'col' }, null, ['Limit']),
  dom('th', { scope: 'col' }, null, ['Next reset'])
]);

/*
const buildLimitRow = ([type, { description, limit, remaining, resetAt }]) => dom('tr', null, null, [
  dom('td', { title: description, style: 'text-transform:capitalize' }, null, [type.replace(/[A-Z]/g, match => ` ${match}`)]),
  dom('td', { style: remaining === 0 ? 'color:rgb(var(--red))' : '' }, null, [remaining]),
  dom('td', null, null, [`/ ${limit}`]),
  dom('td', null, null, [dateTimeFormat.format(new Date(resetAt * 1000))])
]);
*/

const buildLimitRow = ([type, { description, limit, remaining, resetAt }]) => (
  <tr>
    <td title={description} style="text-transform:capitalize">
      {type.replace(/[A-Z]/g, match => ` ${match}`)}
    </td>
    <td style={remaining === 0 ? 'color:rgb(var(--red))' : ''}>{remaining}</td>
    <td>{`/ ${limit}`}</td>
    <td>{dateTimeFormat.format(new Date(resetAt * 1000))}</td>
  </tr>
);

const checkUserLimits = () => {
  showModal({
    title: 'Limit Checker',
    message: ['Hold on while the data is fetched...']
  });

  return Promise.all([apiFetch('/v2/user/limits'), sleep(1000)]);
};

const showUserLimits = ([{ response: { user } }]) => showModal({
  title: 'Here is your data!',
  message: [dom('table', null, null, [tableHeadingsRow, ...Object.entries(user).map(buildLimitRow)])],
  buttons: [modalCompleteButton]
});

const showError = exception => showModal({
  title: 'Something went wrong.',
  message: [exception.message],
  buttons: [modalCompleteButton]
});

const sidebarOptions = {
  id: 'limit-checker',
  title: 'Limit Checker',
  rows: [{
    label: 'Check daily limits',
    onclick: () => checkUserLimits().then(showUserLimits).catch(showError),
    carrot: true
  }]
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
