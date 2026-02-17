#!/usr/bin/env node

import { execSync } from 'node:child_process';

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
  const refs = new Set(execSync(`git log ${latestTag}..HEAD --reverse --pretty --format="%H" --follow src/`, { encoding: 'utf8' }).trim().split('\n'));
  const commits = new Map();

  const response = await fetch(`${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/commits?per_page=100`, { headers });
  if (!response.ok) { throw new Error(`Error ${response.status}: ${response.statusText}`); }

  for (const commit of await response.json()) {
    commits.set(commit.sha, commit);
  }

  if (!refs.isSubsetOf(commits)) { console.warn('Could not find commit info for one or more commits!'); }

  console.log('```md');
  for (const ref of refs) {
    const { author, commit } = commits.get(ref);

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
