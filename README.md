# gstree

CLI to sync folders with separate GitHub repos. Like git subtree, but simpler.

```
   __ _ ___| |_ _ __ ___  ___
  / _` / __| __| '__/ _ \/ _ \
 | (_| \__ \ |_| | |  __/  __/
  \__, |___/\__|_|  \___|\___|
   __/ |
  |___/   git subtree manager
```

## Install

```bash
npm install -g gstree
```

## Prerequisites

- [GitHub CLI](https://cli.github.com/) installed and authenticated (`gh auth login`)

## Usage

### Initialize a synced repo

```bash
# Single folder
gst init packages/studio

# Multiple folders
gst init packages/studio,packages/web

# Use git subtree mode (single folder only)
gst init packages/studio --subtree
```

This will:
1. Create a new GitHub repo (prompts for org and name)
2. Push current folder contents
3. Track it in `.gstree.json`

### Push changes

```bash
# Push all tracked repos
gst push

# Push specific repo
gst push studio
```

### Pull changes

```bash
# Pull all tracked repos
gst pull

# Pull specific repo
gst pull studio
```

### Other commands

```bash
gst                  # Show status
gst sync             # Pull then push everything
gst save "message"   # Commit + push everything
gst commit "message" # Add all + commit
gst list             # List tracked repos
gst remove <name>    # Remove from tracking
```

## Modes

### Copy mode (default)

- Simple file copying between repos
- No git subtree complexity
- Supports multiple folders
- Clean commit history

### Subtree mode (`--subtree`)

- Uses git subtree under the hood
- Single folder only
- Maintains git history connection

## Config

Tracked repos are stored in `.gstree.json`:

```json
{
  "subtrees": [
    {
      "name": "studio",
      "remote": "https://github.com/org/repo-packages-studio.git",
      "prefix": "packages/studio",
      "prefixes": ["packages/studio"],
      "branch": "main",
      "mode": "copy"
    }
  ]
}
```

## License

MIT
