# Contributing to XKit Rewritten

First of all, thanks for taking the time to contribute to this repository!

This document aims to provide guidelines for contributions. For a guide on how to get started, check out the `docs/`.

## Issue guidelines

- Check the list of open issues before submitting your own to help reduce duplicate issues.
- If you see your issue already listed, upvote it by adding a :+1: reaction to the initial comment.

If you are a contributor, try to file issues even if you intend to resolve the problem with a pull request. It may be tempting to immediately work on something and then describe the problem in the pull request body, but it's important that any known issue is acknowledged in the issues tab for everyone to see.

## Pull request guidelines

The project welcomes any pull requests, even if the changes are unrefined or incomplete.

Opening a [draft pull request](https://github.blog/2019-02-14-introducing-draft-pull-requests/) is a useful tool to show maintainers and other contributors that you're actively working on something.

All pull requests must be compatible with the repository license (GPL-3.0).

### Guidelines for contributors
- Give your pull request a descriptive, but concise title. It may be used as part of the next release's patch notes.
- Start your pull request body with a high-level (user-understandable) description of what the changes do.
- Once your pull request has been opened, don't amend or squash commits. Force-pushing to apply a rebase is okay.
- Address all feedback, and address it in the pull request; don't use outside channels to discuss pull request feedback with maintainers.
- Close any pull requests that you don't intend to update. The project maintainers may still reopen and merge these into development branches at a later date if needed.

### Guidelines for maintainers
- If you have to give criticism, always be as constructive as possible.
- Always try to include code suggestions when requesting changes.
- Try not to ask questions in change-requesting reviews. Ideally, general questions should be asked in non-review comments, and questions on specific parts of files should be in neutral reviews.

## Style guide

[![js-semistandard-style](https://raw.githubusercontent.com/standard/semistandard/master/badge.svg)](https://github.com/standard/semistandard)

This project follows JavaScript Semi-Standard Style via [`eslint-config-semistandard`](https://github.com/standard/eslint-config-semistandard).

Stylesheets should follow Nicolas Gallagher's [Idiomatic CSS](https://github.com/necolas/idiomatic-css#readme) principles. Additionally, element IDs and classnames should be `kebab-case`, to fit with the automatic casing of [`data-*` attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*).

Filenames should be `snake_case` to fit with the casing of WebExtension manifest files. This does not apply to vendored files.
