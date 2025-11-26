# Changelog

## 0.0.2 (2025-11-26)

### 🐛 FIX

- Exclude gitignored files from push - Files matching `.gitignore` patterns (like `.env`) are now excluded when pushing to synced repos

## 0.0.1 (2025-11-25)

### 📦 NEW

- Initial release
- `gst init <paths>` - Create synced repo from path(s)
  - Copy mode (default): Simple file sync, no git subtree complexity
  - Subtree mode (`--subtree`): Uses git subtree for single paths
  - Support for multiple comma-separated paths
  - Auto-generates repo name with editable prompt
  - Auto-detects org from current repo
  - Matches visibility (public/private) of parent repo
- `gst pull [name]` - Pull changes from synced repo(s)
- `gst push [name]` - Push changes to synced repo(s)
- `gst sync` - Pull then push everything (main + synced repos)
- `gst save [message]` - Commit + push everything
- `gst commit [message]` - Add all + commit
- `gst status` - Show git status + tracked repos
- `gst list` - List all tracked repos
- `gst remove <name>` - Remove repo from tracking
- Uses GitHub CLI (`gh`) for authentication
- Ora spinners for better UX
- Helpful error messages with fix suggestions
