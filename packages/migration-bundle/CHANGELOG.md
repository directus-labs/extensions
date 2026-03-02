# Changelog

## 1.3.0 - 2026-03-02

> **Development Note:** This release was developed with assistance from Claude Code (Anthropic's AI coding assistant).

### Features

- **Tab-Based UI Redesign:** Complete redesign of the Migration Options interface with organized tabs for each category (Schema, Content, Files, Users, Flows, Extensions, Settings, Translations, Bookmarks, Insights). Addresses [Issue #294](https://github.com/directus-labs/extensions/issues/294).

- **Users Granular Filtering:** Fine-grained control over user-related migrations:
  - Roles filtering with `selectedRoles`
  - Policies filtering with `selectedPolicies`
  - Permissions filtering with `selectedPermissions`
  - User accounts filtering with `selectedUsers`
  - Access rules filtering with `selectedAccess`
  - Dependency auto-selection (selecting a user auto-selects their role)

- **Flows Granular Filtering:** Select specific flows to migrate using `selectedFlows`. Supports both flow ID (UUID) and flow name for flexible filtering.

- **Extensions Granular Filtering:** Select specific extensions to migrate using `selectedExtensions`. Supports ID, schema name, and bundle name matching.

- **Files/Folders Filtering:** New Files tab with folder-based filtering using `selectedFolders`. Migrate only files from selected folders.

- **Settings Granular Filtering:** Select specific settings fields to migrate instead of all settings.

- **Translations Granular Filtering:** Filter translations by:
  - Selected languages with `selectedLanguages`
  - Key pattern matching with `translationKeyPattern`

- **Bookmarks Tab:** New dedicated tab for bookmark (preset) management with `selectedPresets` filtering.

- **Insights Tab:** New dedicated tab for dashboard management with `selectedDashboards` filtering.

- **Comments Integration:** Comments can now be migrated independently or tied to content collections using `includeCommentsForContent`.

- **GUI Collection Context Filtering:** Bookmarks and Flows lists automatically filter based on selected schema collections, showing only relevant items.

- **Local Extensions Warning:** UI notice when local extensions are detected, informing users they must be manually installed on the target.

### Bug Fixes

- **Tab Visibility Bug:** Fixed tabs permanently disappearing after deselecting all items. Root cause was Directus v-select returning `null` instead of `[]`.
- **selectedExtensions Filter:** Now accepts both extension ID and schema.name for matching.
- **Empty usersSelection Skip:** Migration now correctly skips empty user selection objects.
- **Null Collection Handling:** Fixed include/exclude modes to properly handle items with null collection references.
- **Comments Migration:** Moved comments migration outside content block to allow independent migration.

### Environment Variables

New environment variables for granular control:

```bash
# Flows filtering (ID or name, comma-separated)
MIGRATION_BUNDLE_SELECTED_FLOWS=flow-uuid,My Flow Name

# Extensions filtering
MIGRATION_BUNDLE_SELECTED_EXTENSIONS=@directus-labs/field-comments

# Folders filtering
MIGRATION_BUNDLE_SELECTED_FOLDERS=folder-uuid-1,folder-uuid-2

# Users granular options
MIGRATION_BUNDLE_USERS_ROLES=true
MIGRATION_BUNDLE_USERS_POLICIES=true
MIGRATION_BUNDLE_USERS_PERMISSIONS=true
MIGRATION_BUNDLE_USERS_ACCOUNTS=true
MIGRATION_BUNDLE_USERS_ACCESS=true
```

---

## 1.2.0 - 2026-02-24

> **Development Note:** This release was developed with assistance from Claude Code (Anthropic's AI coding assistant).

### Features

- **Collection-Level Selection:** Users can now select specific collections to migrate instead of migrating all content at once. This feature addresses [Issue #266](https://github.com/directus-labs/extensions/issues/266) and [Issue #294](https://github.com/directus-labs/extensions/issues/294).
  - Schema filtering: Only selected collections' schemas are migrated
  - Content filtering: Only selected collections' data is migrated
  - Parent group collections are automatically included when child collections are selected

- **File Filtering by Collection:** Files are now filtered based on selected collections. Only files referenced by the selected collections are migrated, reducing migration payload size and improving performance.

- **Content Collection Selector UI:** New multi-select interface in the Migration Options to choose which collections to migrate.

- **Environment Variable Support:**
  - `MIGRATION_BUNDLE_SELECTED_COLLECTIONS`: Comma-separated list of collections to include
  - `MIGRATION_BUNDLE_EXCLUDED_COLLECTIONS`: Comma-separated list of collections to exclude

### Improvements

- **Schema Option Checkbox:** Added "Schema" as a selectable migration option (previously schema was always migrated)
- **Filtered Panels/Flows/Presets:** Dashboard panels, flows, and presets are now filtered based on their collection references
- **Debug Logging:** Added debug output during schema filtering for troubleshooting

### Important Notes

#### PostgreSQL Requirement for Target Instance

Due to a known Directus bug ([GitHub Issue #20428](https://github.com/directus/directus/issues/20428)), schema migrations may fail on MySQL target instances. The issue occurs because Directus automatically converts `char(36)` to `varchar(36)` in schema diffs for PostgreSQL compatibility, which breaks MySQL foreign key constraints.

**Recommendation:** Use PostgreSQL for the target (destination) Directus instance to ensure reliable schema migrations.

| Target Database | Schema Apply | Status |
|-----------------|--------------|--------|
| PostgreSQL | Works correctly | ✅ Recommended |
| MySQL | May fail with FK constraint errors | ⚠️ Known issue |

### Internal Changes

- Refactored `extract-data.ts` to filter collections list with parent group resolution
- Added `filter-schema.ts` utility for schema snapshot filtering
- Added `filter-schema-diff.ts` utility for diff response filtering
- Modified `extract-system.ts` to filter panels, flows, presets, and comments by collection

---

## 1.1.1 - Previous Release

- Initial release with category-level migration options
- Support for migrating content, users, flows, dashboards, extensions, presets, and comments
