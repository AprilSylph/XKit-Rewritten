import { getTimelineItemWrapper, filterPostElements } from '../util/interface.js';
import { pageModifications, onNewPosts } from '../util/mutations.js';
import { timelineObject } from '../util/react_props.js';
import { keyToCss } from '../util/css_map.js';

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
const search = $(`
  <div class='xkit-timeline-search-container'>
    <div class='xkit-timeline-search-icon'>
      <svg xmlns='http://www.w3.org/2000/svg' height='18' width='18' role='presentation'>
        <use href='#managed-icon__search'></use>
      </svg>
    </div>
    <input type='text' id='${inputId}' placeholder='Search the timeline' value=''>
  </div>
`);

const matchToString = arr => arr.map(x => x[1]).join('');
const queryFilter = function (postElements) {
  const query = document.getElementById(inputId).value.replace('"', '\'').toLowerCase();
  filterPostElements(postElements, { includeFiltered: true }).forEach(async postElement => {
    let filterString = '';
    const str = JSON.stringify(await timelineObject(postElement))
      .replace(/\\"/g, '\'').replace(/"descriptionNpf":\[({"type":"text","text":"([^"]*)"},?)*\],/g, '');

    for (const key in filters) {
      filterString += matchToString([...str.matchAll(filters[key])]);
    }
    filterString = filterString.toLowerCase();
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

export const main = async function () {
  $(keyToCss('postColumn')).prepend(search);
  document.getElementById(inputId).addEventListener('input', debounce(onInput));
};

export const clean = async function () {
  $('.xkit-timeline-search-container').remove();
  $(`[${hiddenAttribute}]`).removeAttr(hiddenAttribute);
  if (pageModifications.listeners.has(queryFilter)) onNewPosts.removeListener(queryFilter);
};

export const stylesheet = true;
