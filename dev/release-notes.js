#!/usr/bin/env node

import { exec } from 'child_process';

const {
  GITHUB_API_URL = 'https://api.github.com',
  GITHUB_REPOSITORY = 'AprilSylph/XKit-Rewritten',
  GITHUB_TOKEN,
} = process.env;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

exec('git log $(git describe --tags --abbrev=0)..HEAD --reverse --pretty --format="%H" --follow src/', async (error, stdout, stderr) => {
  if (error) {
    console.error('error: ', error);
    return;
  }

  if (stderr) {
    console.error('stderr: ', stderr);
  }

  let fatalError = null;

  console.log('```md');
  for (const ref of stdout.split('\n')) {
    if (!ref) { continue; }

    const [response] = await Promise.all([
      fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/commits/${ref}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          ...GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` },
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }),
      sleep(GITHUB_TOKEN ? 0 : 1000),
    ]);
    if (!response.ok) {
      fatalError = `Error ${response.status}: ${response.statusText}`;
      break;
    }

    const { author, commit } = await response.json();
    if (!commit) {
      fatalError = `Fatal: API returned no commit info for ref ${ref}`;
      break;
    }

    console.log(`- ${
      ref
    } ${
      author.type === 'User'
        ? `@${author.login}`
        : `**[${author.login}](${author.html_url})**`
    } ${
      commit.message.includes('\n')
        ? commit.message.slice(0, commit.message.indexOf('\n'))
        : commit.message
    }`);
  }
  console.log('```');

  if (fatalError) {
    console.log(`\`${fatalError}\``);
  }
});
