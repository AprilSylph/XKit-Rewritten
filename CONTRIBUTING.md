# Contributing to XKit Rewritten

First of all, thanks for taking the time to contribute to this repository!

This document aims to provide both guidelines for contributions, and guides for those who want to contribute.

### Contents
#### Guidelines
- [Issue guidelines](#issue-guidelines)
- [Pull request guidelines](#pull-request-guidelines)
#### Guides
- [Understanding GitHub](#understanding-github)
- [WebExtension development](#webextension-development)

---

## Guidelines

### Issue guidelines

1. Always file issues for bugs you encounter, even if you intend to open a pull request to fix them later.
2. Check the list of open issues before submitting your own. If you see your issue already listed, upvote it.
3. Try to make your issues as purposeful as possible, i.e. instead of "how do I do this?", try "it could be clearer how to do this".

### Pull request guidelines

The project welcomes any pull requests, even if the changes are unrefined or incomplete.

Opening a [draft pull request](https://github.blog/2019-02-14-introducing-draft-pull-requests/) is a useful tool to show maintainers and other contributors that you're actively working on something.

All pull requests must be compatible with the repository license (GPL-3.0).

Guidelines for contributors:
1. Give your pull request a descriptive, but concise title. It may be used as part of the next release's patch notes.
2. Start your pull request body with a high-level (user-understandable) description of what the changes do.
3. Once your pull request has been opened, don't amend or squash commits. Force-pushing to apply a rebase is okay.
4. Address all feedback, and address it in the pull request; don't use outside channels to discuss pull request feedback with maintainers.
5. Close any pull requests that you don't intend to update. The project maintainers may still reopen and merge these into development branches at a later date if needed.

Guidelines for maintainers:
1. If you have to give criticism, always be as constructive as possible.
2. Always try to include code suggestions when requesting changes.
3. Try not to ask questions in change-requesting reviews. Ideally, general questions should be asked in non-review comments, and questions on specific parts of files should be in neutral reviews.
4. If your review is requested, but you do not intend to review the pull request, let the contributor know and remove the request.

---

## Guides

### Understanding GitHub

If you're new to GitHub, it may be unclear how you can contribute at all, outside of filing issues.  
Luckily, GitHub provides some guides that should help you get started:
- [Understanding the GitHub flow](https://guides.github.com/introduction/flow/)
- [Forking Projects](https://guides.github.com/activities/forking/)

As a brief summary, you'll need to **fork** (make your own copy of) the project, edit the files in your fork, **commit** (record changes to) the files, and then start a **pull request** (proposal of the changes) back to this repository. Due to the nature of this project, it's best to **clone** (make a local copy of) your fork so that you can play with the files on your machine.

### WebExtension development

Prerequisites:
- [Download and install Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) for your platform
- [Install EditorConfig](https://editorconfig.org/#download) for your favourite text editor
- Install the project dependencies with **`npm install`**

Once you're set up, you'll need to load your copy of the project as a [temporary add-on in Firefox](https://developer.mozilla.org/en-US/docs/Tools/about:debugging#Extensions) or [unpacked extension in Chromium](https://developer.chrome.com/extensions/getstarted#manifest). Be sure to reload it whenever you make changes, or they may not be reflected!

Use **`npm test`** to lint your code. Use it before you start a pull request to ensure it's up to scratch, or to catch any syntax errors if your code isn't doing what you expect.

While you can use `npx web-ext build` to create a ZIP of the WebExtension, it's not loadable via about:addons in Firefox even if you [disable the extension signing requirement](https://support.mozilla.org/en-US/kb/add-on-signing-in-firefox#w_what-are-my-options-if-i-want-to-use-an-unsigned-add-on-advanced-users), since an add-on ID isn't specified in the `manifest.json`.

If you're unfamiliar with the XKit Rewritten framework, check out the `docs/` folder.

Useful links:
- [Browser Extensions - Mozilla | MDN](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Add-on Policies | Firefox Extension Workshop](https://extensionworkshop.com/documentation/publish/add-on-policies/)
- [Develop Extensions - Google Chrome](https://developer.chrome.com/extensions/devguide)
