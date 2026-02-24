# Changelog

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
