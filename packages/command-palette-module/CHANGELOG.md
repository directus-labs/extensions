# Changelog

## [2.0.0] - 2026-10-27

### Breaking
- Requires Directus `>=11.6.0 <13` (was `^11.0.0`).

### Added
- Global search, moved into the palette. Search opted-in collections from Cmd+K, or use the dedicated Global Search page.
- Directus 12 support, including search for non-admins. The search config is mirrored to a read-only global preset, because v12 doesn't let non-admins read the settings field.
- Ask AI: send the current query to the AI Assistant (Directus 11.14+ and 12, when AI is set up).
- Context commands on item pages: copy item link and ID, switch versions, open preview, run flows.
- Bookmarks, My Profile, Toggle Theme and Sign Out commands.
- Item descriptions render with the field's display (labels, booleans, dates and so on).

### Improved
- Palette rebuilt on Reka UI, replacing the bundled cmdk port. Result order is unchanged.
- Much faster to open and search on large projects.
- Plain group headings, and context commands no longer fill up Recents.
- Search snippets merge nearby matches instead of repeating text.

### Fixed
- Display templates with `$thumbnail` request the file fields behind it.
- Global Search page sidebar opens and closes again on Directus 11.14+.
- A failed settings save keeps your edits.
- Flow success toast on Directus 11.6+.
