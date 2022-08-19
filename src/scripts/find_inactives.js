import { dom } from '../util/dom.js';
import { buildStyle } from '../util/interface.js';
import { modalCancelButton, showModal } from '../util/modals.js';
import { buildSvg } from '../util/remixicon.js';
import { addSidebarItem, removeSidebarItem } from '../util/sidebar.js';
import { apiFetch } from '../util/tumblr_helpers.js';

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
  rows: [{ label: 'Find inactive blogs', onclick: () => showFetchBlogs(), carrot: true }],
  visibility: () => /\/following/.test(location.pathname)
};

const width = 900;
const height = 150;

const border = 10;
const innerWidth = width - 2 * border;
const innerHeight = height - 2 * border;

const canvasClass = 'xkit-find-inactives-canvas';
const sliderClass = 'xkit-find-inactives-slider';
const buttonClass = 'xkit-find-inactives-button';
const tableContainerClass = 'xkit-find-inactives-table-container';
const confirmContainerClass = 'xkit-find-inactives-confirm-container';
const avatarClass = 'xkit-find-inactives-avatar';

const styleElement = buildStyle(`
.${canvasClass} {
  width: ${width / 2}px;
  height: ${height / 2}px;
  border-radius: ${border / 2}px;
}

.${sliderClass} {
  width: ${width / 2}px;
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

const computedStyle = getComputedStyle(document.documentElement);
const backgroundColor = `rgb(${computedStyle.getPropertyValue('--secondary-accent')})`;
const gridColor = `rgba(${computedStyle.getPropertyValue('--navy')}, 0.2)`;
const selectionColor = `rgba(${computedStyle.getPropertyValue('--navy')}, 0.8)`;
const dotColor = `rgba(${computedStyle.getPropertyValue('--navy')}, 0.6)`;
const selectedDotColor = `rgb(${computedStyle.getPropertyValue('--accent')})`;

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
    '/v2/user/following?fields[blogs]=name,avatar,title,updated,?is_following_you';

  // todo: remove this; for testing only
  // let count = 0;

  while (resource) {
    await Promise.all([
      apiFetch(resource).then(({ response }) => {
        blogs.push(...response.blogs);
        resource = response.links?.next?.href;

        // todo: remove this; for testing only
        // if (count++ > 3) resource = null;

        foundBlogsElement.textContent = `Found ${blogs.length} blogs${resource ? '...' : '.'}`;
      }),
      sleep(500)
    ]);
  }

  blogs.sort((a, b) => b.updated - a.updated);
  console.log(blogs);

  showSelectBlogs(blogs);
};

const showSelectBlogs = blogs => {
  const canvasElement = dom('canvas', { width, height, class: canvasClass });
  const canvasContext = canvasElement.getContext('2d');

  const ONE_YEAR = 31556952;

  const allTimes = blogs.map(({ updated }) => updated).filter(Boolean);
  const maxTime = Math.max(...allTimes);
  const minTime = Math.min(...allTimes, maxTime - ONE_YEAR);
  const dateRange = maxTime - minTime;

  const timeToX = time => ((time - minTime) * innerWidth) / dateRange + border;

  blogs.forEach(blog => {
    blog.randomYValue = Math.random() * innerHeight + border;

    const followingIcon = buildSvg('managed-icon__following');
    followingIcon.style = `visibility: ${blog.isFollowingYou ? 'shown' : 'hidden'};`;

    const avatar = dom('img', {
      src: blog.avatar[blog.avatar.length - 1]?.url,
      class: avatarClass
    });
    blog.checkbox = dom('input', { type: 'checkbox' });
    const link = dom(
      'a',
      { href: `https://www.tumblr.com/blog/view/${blog.name}`, target: '_blank' },
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
  const table = dom('table');

  const updateCanvas = sliderTime => {
    canvasContext.fillStyle = backgroundColor;
    canvasContext.fillRect(0, 0, width, height);

    canvasContext.fillStyle = gridColor;
    for (let time = maxTime; time >= minTime; time -= ONE_YEAR) {
      canvasContext.fillRect(timeToX(time) - 1, border, 2, innerHeight);
    }

    canvasContext.fillStyle = selectionColor;
    canvasContext.fillRect(timeToX(sliderTime) - 1, border, 2, innerHeight);

    const dotSize = 3;
    blogs.forEach(({ updated, randomYValue }) => {
      canvasContext.fillStyle = updated < sliderTime ? selectedDotColor : dotColor;
      canvasContext.fillRect(
        timeToX(updated) - dotSize,
        randomYValue - dotSize,
        dotSize * 2,
        dotSize * 2
      );
    });
  };

  const updateDisplay = sliderPercent => {
    const sliderTime = (sliderPercent / 100) * dateRange + minTime;

    updateCanvas(sliderTime);

    visibleBlogs = blogs.filter(({ updated }) => updated < sliderTime);

    blogs
      .filter(blog => visibleBlogs.includes(blog) === false)
      .forEach(({ checkbox }) => {
        checkbox.checked = false;
      });

    const blogsString = visibleBlogs.length === 1 ? 'blog is' : 'blogs are';
    const relativeTime = constructRelativeTimeString(sliderTime);
    selectionInfo.textContent = `${visibleBlogs.length} followed ${blogsString} inactive since ${relativeTime}`;

    table.replaceChildren(...visibleBlogs.map(({ selectTableRow }) => selectTableRow));
  };

  updateDisplay(0);

  const slider = dom(
    'input',
    { type: 'range', value: 0, class: sliderClass },
    { input: event => updateDisplay(event.target.value) }
  );

  const createButton = (text, onClick) =>
    dom('button', { class: buttonClass }, { click: onClick }, [text]);

  const selectNoneButton = createButton('none', () =>
    visibleBlogs.forEach(({ checkbox }) => {
      checkbox.checked = false;
    })
  );
  const selectAllNoMutualsButton = createButton('all (no mutuals)', () =>
    visibleBlogs.forEach(({ checkbox, isFollowingYou }) => {
      checkbox.checked = !isFollowingYou;
    })
  );
  const selectAllWithMutualsButton = createButton('all (including mutuals)', () =>
    visibleBlogs.forEach(({ checkbox }) => {
      checkbox.checked = true;
    })
  );

  const onClickContinue = () => {
    const selectedBlogs = visibleBlogs.filter(({ checkbox }) => checkbox.checked);
    if (selectedBlogs.length) {
      showConfirmBlogs(selectedBlogs, render);
    } else {
      showModal({
        title: 'Nothing selected!',
        message: ['Select the checkboxes next to blogs you want to unfollow and try again.'],
        buttons: [dom('button', null, { click: render }, ['Back'])]
      });
    }
  };

  const render = () =>
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
          selectAllNoMutualsButton,
          ' / ',
          selectAllWithMutualsButton
        ]),
        dom('div', { class: tableContainerClass }, null, [table])
      ],
      buttons: [
        modalCancelButton,
        dom('button', { class: 'blue' }, { click: onClickContinue }, ['Unfollow Selected'])
      ]
    });

  render();
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
      dom('button', { class: 'red' }, { click: () => showUnfollowBlogs(blogs) }, ['Unfollow'])
    ]
  });
};

const showUnfollowBlogs = async blogs => {
  const unfollowedBlogsElement = dom('span', null, null, ['Unfollowed 0 blogs...']);
  showModal({
    title: 'Unfollowing blogs...',
    message: [
      dom('small', null, null, ['Please wait.']),
      dom('br'),
      dom('br'),
      unfollowedBlogsElement
    ],
    buttons: [modalCancelButton]
  });
};

export const main = async () => {
  document.head.append(styleElement);
  addSidebarItem(sidebarOptions);
};

export const clean = async () => {
  styleElement.remove();
  removeSidebarItem(sidebarOptions.id);
};
