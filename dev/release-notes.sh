git log $(git describe --tags --abbrev=0)..HEAD --reverse --pretty --format="- %h **%an** %s" --follow src/ > release-notes.md
