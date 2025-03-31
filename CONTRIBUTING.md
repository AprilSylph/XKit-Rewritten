# Contributing guidelines for XKit Rewritten

Thanks for showing interest in the project!
Check out the `docs/` if you're looking for technical documentation.

## Issue guidelines

- Check the list of open issues before submitting your own to help reduce duplicate issues.
- If you see your issue already listed, upvote it by adding a :+1: reaction to the initial comment.

If you are a contributor, try to file issues even if you intend to resolve the problem with a pull request. It may be tempting to immediately work on something and then describe the problem in the pull request body, but it's important that any known issue is acknowledged in the issues tab for everyone to see.

## Pull request guidelines

- Give your pull request a terse, non-technical title. If merged, it will be included in the release notes.
- Please follow the pull request template. It is designed to help both you and your reviewer.
- Feel free to open draft pull requests with incomplete or unrefined changes.
- Try to avoid force-pushing your branch once your pull request is in review.
- Close any pull requests that you don't intend to update.

All pull requests must be compatible with the repository license (GPL-3.0).

### Style guide

This project follows JavaScript Standard Style with semicolons via [`neostandard`](https://github.com/neostandard/neostandard).

Stylesheets should aim to follow Nicolas Gallagher's [Idiomatic CSS](https://github.com/necolas/idiomatic-css#readme) principles. Additionally, element classnames and IDs should be `kebab-case`, to fit with the automatic casing of [`data-*` attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/data-*).

Filenames should be `snake_case` to fit with the casing of WebExtension manifest files. This does not apply to vendored files.
