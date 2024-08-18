import { dom } from '../utils/dom.js';
import { buildStyle } from '../utils/interface.js';
import { hideModal, modalCancelButton, showErrorModal, showModal } from '../utils/modals.js';
import { buildSvg } from '../utils/remixicon.js';
import { addSidebarItem, removeSidebarItem } from '../utils/sidebar.js';
import { apiFetch } from '../utils/tumblr_helpers.js';
import { userInfo } from '../utils/user.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const relativeTimeFormat = new Intl.RelativeTimeFormat(document.documentElement.lang, { style: 'long' });
const thresholds = [
  { unit: 'year', denominator: 31557600 },
  { unit: 'month', denominator: 2629800 },
  { unit: 'week', denominator: 604800 },
  { unit: 'day', denominator: 86400 },
  { unit: 'hour', denominator: 3600 },
  { unit: 'minute', denominator: 60 },
  { unit: 'second', denominator: 1 }
];
const constructRelativeTimeString = function (unixTime) {
  const now = Math.trunc(new Date().getTime() / 1000);
  const unixDiff = unixTime - now;
  const unixDiffAbsolute = Math.abs(unixDiff);

  for (const { unit, denominator } of thresholds) {
    if (unixDiffAbsolute >= denominator) {
      const value = Math.trunc(unixDiff / denominator);
      return relativeTimeFormat.format(value, unit);
    }
  }

  return relativeTimeFormat.format(-0, 'second');
};

const sidebarOptions = {
  id: 'find-inactives',
  title: 'Find Inactives',
  rows: [
    {
      label: 'Find inactive blogs',
      onclick: () => showFetchBlogs().catch(showErrorModal),
      carrot: true
    }
  ],
  visibility: () => /\/following/.test(location.pathname)
};

const buckets = 90;
const lastBucket = buckets - 1;
const dotGridSize = 5;
const dotSize = 2;

const canvasInnerWidth = lastBucket * dotGridSize;
const canvasInnerHeight = 65;
const canvasBorder = 5;
const canvasOuterWidth = canvasInnerWidth + canvasBorder * 2;
const canvasOuterHeight = canvasInnerHeight + canvasBorder * 2;

const canvasClass = 'xkit-find-inactives-canvas';
const sliderClass = 'xkit-find-inactives-slider';
const buttonClass = 'xkit-find-inactives-button';
const tableContainerClass = 'xkit-find-inactives-table-container';
const confirmContainerClass = 'xkit-find-inactives-confirm-container';
const avatarClass = 'xkit-find-inactives-avatar';

export const styleElement = buildStyle(`
.${canvasClass} {
  width: ${canvasOuterWidth}px;
  height: ${canvasOuterHeight}px;
  border-radius: ${canvasBorder}px;
}

.${sliderClass} {
  width: ${canvasOuterWidth}px;
}

.${buttonClass} {
  font-size: inherit;
  text-decoration: underline;
}

.${tableContainerClass} {
  height: 300px;
  overflow: auto;
}

.${tableContainerClass} svg, .${confirmContainerClass} svg {
  width: 12px;
  height: 12px;
  --icon-color-primary:RGB(var(--green));
}

.${avatarClass} {
  width: 1rem;
  height: 1rem;
}

.${confirmContainerClass} {
  max-height: 300px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
}
`);

const showFetchBlogs = async () => {
  const foundBlogsElement = dom('span', null, null, ['Found 0 blogs...']);
  showModal({
    title: 'Gathering followed blogs...',
    message: [
      dom('small', null, null, ['Please wait.']),
      dom('br'),
      dom('br'),
      foundBlogsElement
    ]
  });

  const blogs = [];
  let resource =
    '/v2/user/following?fields[blogs]=name,avatar,title,updated,blog_view_url,?is_following_you';

  while (resource) {
    await Promise.all([
      apiFetch(resource).then(({ response }) => {
        blogs.push(...response.blogs);
        resource = response.links?.next?.href;

        foundBlogsElement.textContent = `Collected ${blogs.length}/${userInfo.following} blogs${resource ? '...' : '.'}`;
      }),
      sleep(500)
    ]);
  }
  blogs.sort((a, b) => b.updated - a.updated);

  showSelectBlogs(blogs);
};

const showSelectBlogs = blogs => {
  const ONE_YEAR = 31556952;

  const allTimes = blogs.map(({ updated }) => updated).filter(Boolean);
  const maxTime = Math.max(...allTimes);
  const minTime = Math.min(...allTimes, maxTime - ONE_YEAR);
  const dateRange = maxTime - minTime;

  blogs.forEach(blog => {
    blog.bucket = Math.floor(buckets * (blog.updated - minTime) / dateRange);
    if (blog.bucket === buckets) blog.bucket--;

    const height = blogs.filter(({ bucket }) => blog.bucket === bucket).length;

    blog.xValue = blog.bucket * dotGridSize + canvasBorder;
    blog.yValue = canvasInnerHeight - height * dotGridSize + canvasBorder;

    const followingIcon = buildSvg('managed-icon__following');
    followingIcon.style = `visibility: ${blog.isFollowingYou ? 'shown' : 'hidden'};`;

    const avatar = dom('img', {
      src: blog.avatar.at(-1)?.url,
      class: avatarClass
    });
    blog.checkbox = dom('input', { type: 'checkbox' });
    const link = dom(
      'a',
      { href: blog.blogViewUrl, target: '_blank' },
      null,
      [blog.name]
    );
    const relativeUpdated = blog.updated ? constructRelativeTimeString(blog.updated) : 'never';

    blog.selectTableRow = dom('tr', null, null, [
      dom('td', null, null, [followingIcon]),
      dom('td', null, null, [avatar]),
      dom('td', null, null, [link]),
      dom('td', null, null, [relativeUpdated]),
      dom('td', null, null, [blog.checkbox])
    ]);

    blog.confirmElement = dom('div', null, null, [avatar.cloneNode(true), ` ${blog.name}`]);
  });

  let visibleBlogs = [];

  const selectionInfo = dom('div');
  const table = dom('table', null, null, blogs.map(({ selectTableRow }) => selectTableRow));

  const canvasScale = 2;
  const canvasElement = dom('canvas', {
    width: canvasOuterWidth * canvasScale,
    height: canvasOuterHeight * canvasScale,
    class: canvasClass
  });
  const canvasContext = canvasElement.getContext('2d');
  canvasContext.scale(canvasScale, canvasScale);

  const computedStyle = getComputedStyle(document.documentElement);
  const backgroundColor = `rgb(${computedStyle.getPropertyValue('--secondary-accent')})`;
  const gridColor = `rgba(${computedStyle.getPropertyValue('--navy')}, 0.2)`;
  const selectionColor = `rgba(${computedStyle.getPropertyValue('--navy')}, 0.8)`;
  const dotColor = `rgba(${computedStyle.getPropertyValue('--navy')}, 0.6)`;
  const selectedDotColor = `rgb(${computedStyle.getPropertyValue('--deprecated-accent')})`;

  const timeToCanvasX = time => ((time - minTime) * canvasInnerWidth) / dateRange + canvasBorder;

  const updateCanvas = sliderValue => {
    canvasContext.fillStyle = backgroundColor;
    canvasContext.fillRect(0, 0, canvasOuterWidth, canvasOuterHeight);

    canvasContext.fillStyle = gridColor;
    for (let time = maxTime; time >= minTime; time -= ONE_YEAR) {
      canvasContext.fillRect(timeToCanvasX(time) - 1, canvasBorder, 2, canvasInnerHeight);
    }

    canvasContext.fillStyle = selectionColor;
    canvasContext.fillRect(canvasBorder + sliderValue * dotGridSize - 1, canvasBorder, 2, canvasInnerHeight);

    blogs.forEach(({ bucket, xValue, yValue }) => {
      canvasContext.fillStyle = bucket <= sliderValue ? selectedDotColor : dotColor;
      canvasContext.fillRect(xValue - dotSize, yValue - dotSize, dotSize * 2, dotSize * 2);
    });
  };

  const updateDisplay = sliderValue => {
    const sliderTime = (sliderValue / lastBucket) * dateRange + minTime;

    updateCanvas(sliderValue);

    visibleBlogs = blogs.filter(({ bucket }) => bucket <= sliderValue);

    blogs.forEach(blog => {
      blog.selectTableRow.style.display = visibleBlogs.includes(blog) ? 'table-row' : 'none';
    });

    blogs
      .filter(blog => visibleBlogs.includes(blog) === false)
      .forEach(({ checkbox }) => {
        checkbox.checked = false;
      });

    const blogsString = visibleBlogs.length === 1 ? 'blog is' : 'blogs are';
    const relativeTime = constructRelativeTimeString(sliderTime);
    selectionInfo.textContent = `${visibleBlogs.length} followed ${blogsString} inactive since ${relativeTime}`;
  };

  updateDisplay(0);

  const slider = dom(
    'input',
    { type: 'range', value: 0, max: lastBucket, class: sliderClass },
    { input: event => updateDisplay(event.target.value) }
  );

  const createButton = (text, onClick) =>
    dom('button', { class: buttonClass }, { click: onClick }, [text]);

  const selectNoneButton = createButton('none', () =>
    visibleBlogs.forEach(({ checkbox }) => {
      checkbox.checked = false;
    })
  );
  const selectNonMutualsButton = createButton('non-mutuals', () =>
    visibleBlogs.forEach(({ checkbox, isFollowingYou }) => {
      checkbox.checked = !isFollowingYou;
    })
  );
  const selectAllButton = createButton('all', () =>
    visibleBlogs.forEach(({ checkbox }) => {
      checkbox.checked = true;
    })
  );

  const onClickContinue = () => {
    const selectedBlogs = visibleBlogs.filter(({ checkbox }) => checkbox.checked).reverse();
    if (selectedBlogs.length) {
      showConfirmBlogs(selectedBlogs, showSelectBlogsModal);
    } else {
      showModal({
        title: 'Nothing selected!',
        message: ['Select the checkboxes next to blogs you want to unfollow and try again.'],
        buttons: [dom('button', null, { click: showSelectBlogsModal }, ['Back'])]
      });
    }
  };

  const showSelectBlogsModal = () =>
    showModal({
      title: 'Select Inactive Blogs',
      message: [
        dom('small', null, null, [
          'Use the slider to display blogs with no posts after the selected date.'
        ]),
        canvasElement,
        slider,
        selectionInfo,
        dom('div', { style: 'height: 0.5em' }),
        dom('div', null, null, [
          'select: ',
          selectNoneButton,
          ' / ',
          selectNonMutualsButton,
          ' / ',
          selectAllButton
        ]),
        dom('div', { class: tableContainerClass }, null, [table])
      ],
      buttons: [
        modalCancelButton,
        dom('button', { class: 'blue' }, { click: onClickContinue }, ['Unfollow Selected'])
      ]
    });

  showSelectBlogsModal();
};

const showConfirmBlogs = (blogs, goBack) => {
  showModal({
    title: 'Are you sure?',
    message: [
      `Do you want to unfollow ${blogs.length} blogs?`,
      dom('br'),
      dom('br'),
      dom(
        'div',
        { class: confirmContainerClass },
        null,
        blogs.map(({ confirmElement }) => confirmElement)
      )
    ],
    buttons: [
      dom('button', null, { click: goBack }, ['Go back']),
      dom('button', { class: 'red' }, { click: () => unfollowBlogs(blogs) }, ['Unfollow'])
    ]
  });
};

const unfollowBlogs = async blogs => {
  const blogNames = blogs.map(({ name }) => name);
  const unfollowStatus = dom('span', null, null, ['Unfollowed 0 blogs...']);
  showModal({
    title: 'Unfollowing blogs...',
    message: [
      dom('small', null, null, ['Do not navigate away from this page.']),
      dom('br'),
      dom('br'),
      unfollowStatus
    ]
  });

  const succeeded = [];
  const failed = [];

  for (const blogName of blogNames) {
    await Promise.all([
      apiFetch('/v2/user/unfollow', { method: 'POST', body: { url: `https://${blogName}.tumblr.com/` } }).then(() => {
        succeeded.push(blogName);
      }).catch(() => {
        failed.push(blogName);
      }).finally(() => {
        unfollowStatus.textContent = `Unfollowed ${succeeded.length} blogs... ${failed.length ? `(failed: ${failed.length})` : ''}`;
      }),
      sleep(1000)
    ]);
  }

  if (failed.length) console.error('Find Inactives failed to unfollow:', failed.join(', '));

  showModal({
    title: 'All done!',
    message: [
      `Unfollowed ${succeeded.length} blogs${failed.length ? ` (failed: ${failed.length})` : ''}.\n`,
      'Refresh the page to see the result.'
    ],
    buttons: [
      dom('button', null, { click: hideModal }, ['Close']),
      dom('button', { class: 'blue' }, { click: () => location.reload() }, ['Refresh'])
    ]
  });
};

export const main = async () => {
  addSidebarItem(sidebarOptions);
};

export const clean = async () => {
  removeSidebarItem(sidebarOptions.id);
};
