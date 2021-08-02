git log $(git describe --tags --abbrev=0)..HEAD --reverse --pretty --format="- %h %s (%an)" --follow src/ > release-notes.md
