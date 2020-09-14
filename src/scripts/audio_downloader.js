(function () {
  let audioBlockSelector;

  const process = function () {
    [...document.querySelectorAll('audio > source[src]:not(.xkit-audio-downloader-done)')]
    .forEach(source => {
      source.classList.add('xkit-audio-downloader-done');
      const { src } = source;

      const div = document.createElement('div');
      div.className = 'audio-downloader';

      const downloadButton = document.createElement('button');
      downloadButton.textContent = '(Download)';
      downloadButton.onclick = function (event) {
        event.stopPropagation();

        const filename = new URL(src).pathname.replace('/', '');

        fetch(src)
        .then(response => response.blob())
        .then(blob => {
          const blobURL = window.URL.createObjectURL(blob);
          const downloadLink = Object.assign(document.createElement('a'), {
            style: { display: 'none' },
            href: blobURL,
            download: filename,
          });

          document.body.appendChild(downloadLink);
          downloadLink.click();
          downloadLink.parentNode.removeChild(downloadLink);
          window.URL.revokeObjectURL(blobURL);
        });
      };

      div.appendChild(downloadButton);
      $(source).parents(audioBlockSelector).after(div);
    });
  };

  const main = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css_map.js');
    audioBlockSelector = await keyToCss('audioBlock');
    onNewPosts.addListener(process);
    process();
  };

  const clean = async function () {
    const { onNewPosts } = await fakeImport('/src/util/mutations.js');
    onNewPosts.removeListener(process);
    $('.xkit-audio-downloader-done').removeClass('xkit-audio-downloader-done');
    $('.audio-downloader').remove();
  };

  return { main, clean, stylesheet: true };
})();
