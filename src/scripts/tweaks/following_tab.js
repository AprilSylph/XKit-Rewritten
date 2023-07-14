import { navigate } from '../../util/tumblr_helpers.js';

const attemptRedirect = () => {
  if (
    ['/dashboard', '/'].includes(location.pathname) &&
    document
      .querySelector('main')
      ?.querySelector(':scope > [data-timeline^="/v2/tabs/for_you"]')
  ) {
    navigate('/dashboard/following');
  }
};
const observer = new MutationObserver(attemptRedirect);

export const main = async function () {
  attemptRedirect();

  observer.observe(document.getElementById('root'), {
    childList: true,
    subtree: true,
    attributeFilter: ['data-timeline']
  });
};

export const clean = async function () {
  observer.disconnect();
};
