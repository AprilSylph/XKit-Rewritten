#!/usr/bin/env node

import { execSync } from 'node:child_process';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const {
  GITHUB_API_URL = 'https://api.github.com',
  GITHUB_REPOSITORY = 'AprilSylph/XKit-Rewritten',
  GITHUB_TOKEN,
} = process.env;

const headers = new Headers();
headers.append('Accept', 'application/vnd.github+json');
headers.append('X-GitHub-Api-Version', '2022-11-28');
GITHUB_TOKEN && headers.append('Authorization', `Bearer ${GITHUB_TOKEN}`);

try {
  const latestTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim();
  const refs = execSync(`git log ${latestTag}..HEAD --reverse --pretty --format="%H" --follow src/`, { encoding: 'utf8' }).trim().split('\n');

  console.log('```md');
  for (const ref of refs) {
    if (!ref) { continue; }

    const [response] = await Promise.all([
      fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/commits/${ref}`, { headers }),
      sleep(GITHUB_TOKEN ? 0 : 1000),
    ]);
    if (!response.ok) {
      console.log('```');
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const { author, commit } = await response.json();
    if (!commit) {
      console.log('```');
      throw new Error(`Fatal: API returned no commit info for ref ${ref}`);
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
} catch (exception) {
  console.error(exception);
}
