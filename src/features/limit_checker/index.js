import { apiFetch } from '../../utils/tumblr_helpers.js';
import { addSidebarItem, removeSidebarItem } from '../../utils/sidebar.js';
import { modalCompleteButton, showErrorModal, showModal } from '../../utils/modals.js';
import { table, td, th, tr } from '../../utils/dom.js';

const dateTimeFormat = new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: 'short', timeStyle: 'short' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const tableHeadingsRow = tr({}, [
  th({ scope: 'col' }, ['Type']),
  th({ scope: 'col' }, ['Remaining']),
  th({ scope: 'col' }, ['Limit']),
  th({ scope: 'col' }, ['Next reset'])
]);

const buildLimitRow = ([type, { description, limit, remaining, resetAt }]) => tr({}, [
  td({ title: description, style: 'text-transform:capitalize' }, [type.replace(/[A-Z]/g, match => ` ${match}`)]),
  td({ style: remaining === 0 ? 'color:rgb(var(--red))' : '' }, [remaining]),
  td({}, [`/ ${limit}`]),
  td({}, [dateTimeFormat.format(new Date(resetAt * 1000))])
]);

const checkUserLimits = () => {
  showModal({
    title: 'Limit Checker',
    message: ['Hold on while the data is fetched...']
  });

  return Promise.all([apiFetch('/v2/user/limits'), sleep(1000)]);
};

const showUserLimits = ([{ response: { user } }]) => showModal({
  title: 'Here is your data!',
  message: [table({}, [tableHeadingsRow, ...Object.entries(user).map(buildLimitRow)])],
  buttons: [modalCompleteButton]
});

const sidebarOptions = {
  id: 'limit-checker',
  title: 'Limit Checker',
  rows: [{
    label: 'Check daily limits',
    onclick: () => checkUserLimits().then(showUserLimits).catch(showErrorModal),
    carrot: true
  }]
};

export const main = async () => addSidebarItem(sidebarOptions);
export const clean = async () => removeSidebarItem(sidebarOptions.id);
