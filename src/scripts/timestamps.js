(function() {
  let noteCountSelector;

  const constructTimeString = function(unixTime) {
    const date = new Date(unixTime * 1000);
    const now = new Date();

    const sameDate = date.toDateString() === now.toDateString();
    const sameYear = date.getFullYear() === now.getFullYear();

    if (sameDate) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: 'numeric',
      });
    } else {
      return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: sameYear ? undefined : 'numeric',
      });
    }
  }

  const addPostTimestamps = async function() {
    const { timelineObject } = await fakeImport('/src/util/react-props.js');

    [...document.querySelectorAll('[data-id]:not(.xkit_timestamps_done)')]
    .forEach(async postElement => {
      postElement.classList.add('xkit_timestamps_done');

      const post_id = postElement.dataset.id;
      const {timestamp} = await timelineObject(post_id);

      const noteCountElement = postElement.querySelector(noteCountSelector);

      const timestampElement = document.createElement('div');
      timestampElement.className = 'xkit_timestamp';
      timestampElement.textContent = constructTimeString(timestamp);

      $(noteCountElement).after(timestampElement);
    });
  }

  const main = async function() {
    const { newPostListener } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    noteCountSelector = await keyToCss('noteCount');

    newPostListener.addListener(addPostTimestamps);
    addPostTimestamps();
  }

  const clean = async function() {
    const { newPostListener } = await fakeImport('/src/util/mutations.js');
    newPostListener.removeListener(addPostTimestamps);
    $('.xkit_timestamp').remove();
    $('.xkit_timestamps_done').removeClass('xkit_timestamps_done');
  }

  const stylesheet = '/src/scripts/timestamps.css';

  return { main, clean, stylesheet };
})();
