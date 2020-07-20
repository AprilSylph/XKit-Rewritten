GITHUB_REPOSITORY="AprilSylph/XKit-Rewritten"
git log $(git describe --tags --abbrev=0)..HEAD --pretty --format="- [\`%h\`](https://github.com/$GITHUB_REPOSITORY/commit/%H) %s (%an)" > release-notes.md
