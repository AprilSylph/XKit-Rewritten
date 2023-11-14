import { getTimelineItemWrapper, filterPostElements } from '../util/interface.js';
import { pageModifications, onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';
import { keyToCss } from '../util/css_map.js';
import { dom } from '../util/dom.js';

const filters = {
  name: /"name":"([\w\d]*)"/g,
  blogName: /"blogName":"([\w\d]*)"/g,
  rebloggedRootName: /"rebloggedRootName":"([\w\d]*)"/g,
  rebloggedFromName: /"blogName":"([\w\d]*)"/g,
  summary: /"summary":"([^"]*)"/g,
  text: /"text":"([^"]*)"/g,
  tags: /"tags":\[((?:"(?:[^"]*)",?)*)\]/g
};
const hiddenAttribute = 'data-timeline-search-hidden';
const inputId = 'xkit-timeline-search-textarea';

const matchToString = arr => arr.map(x => x[1]).join('');
const queryFilter = function (postElements) {
  const query = document.getElementById(inputId).value.replace('"', '\'').toLowerCase();
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    let filterString = '';

    if (postElement.__timeline_search_filter) {
      filterString = postElement.__timeline_search_filter;
    } else {
      const str = JSON.stringify(await timelineObject(postElement))
        .replace(/\\"/g, '\'').replace(/"descriptionNpf":\[({"type":"text","text":"([^"]*)"},?)*\],/g, '');

      for (const key in filters) {
        filterString += matchToString([...str.matchAll(filters[key])]);
      }
      filterString = filterString.toLowerCase();
      postElement.__timeline_search_filter = filterString;
    }
    if (!filterString.includes(query)) {
      getTimelineItemWrapper(postElement)?.setAttribute(hiddenAttribute, '');
    }
  });
};
const debounce = func => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), 500);
  };
};
const onInput = ({ target }) => {
  if (pageModifications.listeners.has(queryFilter)) onNewPosts.removeListener(queryFilter);
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  if (target.value) onNewPosts.addListener(queryFilter);
};
const search = dom('div', { class: 'xkit-timeline-search-container' }, null, [
  dom('div', { class: 'xkit-timeline-search-icon' }, null, [
    dom('svg', { xmlns: 'http://www.w3.org/2000/svg', height: 18, width: 18, role: 'presentation' }, null, [
      dom('use', { href: '#managed-icon__search' }, null, null)
    ]),
    dom('input', { type: 'text', id: inputId, placeholder: 'Search the timeline', value: '' }, { input: debounce(onInput) }, null)
  ])
]);
const renderSearch = element => element[0].prepend(search);

export const main = async function () {
  pageModifications.register(keyToCss('postColumn'), renderSearch);
};

export const clean = async function () {
  pageModifications.unregister(renderSearch);
  $('.xkit-timeline-search-container').remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  if (pageModifications.listeners.has(queryFilter)) onNewPosts.removeListener(queryFilter);
};

export const stylesheet = true;
