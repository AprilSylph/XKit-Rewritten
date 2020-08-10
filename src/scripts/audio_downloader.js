(function() {
  let audioBlockSelector;

  const process = function() {
    [...document.querySelectorAll('audio > source[src]:not(.audio_downloader_done)')]
    .forEach(source => {
      source.classList.add('audio_downloader_done');
      const {src} = source;

      const div = document.createElement('div');
      div.className = 'audio_downloader';

      const downloadButton = document.createElement('button');
      downloadButton.textContent = '(Download)';
      downloadButton.onclick = function(event) {
        event.stopPropagation();

        const filename = (new URL(src)).pathname.replace('/', '');

        fetch(src)
        .then(response => response.blob())
        .then(blob => {
          const blob_url = window.URL.createObjectURL(blob);
          const download_link = Object.assign(document.createElement('a'), {
            style: { display: 'none' },
            href: blob_url,
            download: filename,
          });

          document.body.appendChild(download_link);
          download_link.click();
          download_link.parentNode.removeChild(download_link);
          window.URL.revokeObjectURL(blob_url);
        })
      };

      div.appendChild(downloadButton);
      $(source).parents(audioBlockSelector).after(div);
    });
  }

  const main = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    const { keyToCss } = await fakeImport('/src/util/css-map.js');
    audioBlockSelector = await keyToCss('audioBlock');
    postListener.addListener(process);
    process();
  }

  const clean = async function() {
    const { postListener } = await fakeImport('/src/util/mutations.js');
    postListener.removeListener(process);
    $('.audio_downloader_done').removeClass('audio_downloader_done');
    $('.audio_downloader').remove();
  }

  const stylesheet = '/src/scripts/audio_downloader.css';

  return { main, clean, stylesheet };
})();
