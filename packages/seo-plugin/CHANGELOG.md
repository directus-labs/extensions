# Changelog

## 1.2.0 - 2026-10-27

### Compatibility

-   **Directus 12:** Host range widened to `>=10.10.0 <13`, so the marketplace no longer flags the plugin as incompatible on v11 and v12. Extensions SDK updated to 18.1.0.
-   **Locked items:** Title, meta description, and custom fields now respect `disabled`, so published items in versioned collections can't be edited in place.
-   Replaced the removed `rounded` button prop and CSS variables that no longer exist in v12.
-   Tabs now match the style of core's Tabs group interface.

### Features

-   **Translations:** The interface and display follow the user's Directus language. Included: English, German, Spanish, French, Italian, Japanese, Korean, Dutch, Polish, Portuguese (Brazil), Vietnamese, and Chinese (Simplified). UI translation work started in #301 by @khuepm.
-   Keyphrase analysis now works for Japanese, Chinese, Korean, and Thai content.
-   **Required custom fields:** The Custom Fields tab shows an error icon while required fields are empty (#288).

### Fixes

-   Opening an existing item with empty SEO data no longer marks the form as changed. Defaults are only filled in on new items.
-   Changing one sitemap setting no longer drops the other.
-   Fixed an infinite request loop when the site favicon fails to load (#299).
-   Keyphrases with accents now match WYSIWYG content that stores them as HTML entities like `&eacute;` (#323).
-   Keyphrases match whole words only ("seo" no longer matches "Seoul").
-   The slug check ignores accents and no longer passes every non-Latin keyphrase.
-   Alt text containing quotes and headings spanning multiple lines are now read correctly.
-   The length meter in the analysis no longer always shows full.
-   The keyphrase field no longer swallows the Enter key elsewhere on the page.
-   Code editors and other interfaces in the Custom Fields tab render at full size (#292).
-   OG images stored as a bare UUID now load, and a missing or unreadable file shows an error with a deselect action.
-   Fixed image URLs on installs served from a subpath.
-   The display no longer crashes when interface options were never saved.
-   The "Custom SEO Fields" option is no longer required.

### Improvements

-   Bundle size cut from 132KB to 80KB (36KB to 20KB gzipped) by dropping `reka-ui`, `lodash-es`, `micromustache`, and `@vueuse/core`.
-   Tabs and the platform switcher support keyboard navigation (arrow keys, Home, End).

## 1.1.0 - 2025-04-21

### Features

-   **SEO Analysis & Focus Keyphrase:** Introduced a new "Keyphrase" tab with functionality to set a focus keyphrase and analyze its usage in the title, meta description, URL slug, and content fields. Includes detailed feedback on problems, improvements, and good results.
-   **Social Media Previews:** Added an "Open Graph Image" field and a preview component (`OgImagePreview`) to visualize how shared content will appear on social media platforms.
-   **New Interface Options:** Added interface options to configure the focus keyphrase functionality, including selecting the relevant slug and content fields.

### Improvements

-   **Interface Redesign:** Refactored the SEO interface into tabs (Basic, Advanced, Custom Fields, Keyphrase) for better organization.
-   **Search Preview:** Enhanced the `SearchPreview` component with improved styling, text handling, and error handling.
-   **Field Updates:** Renamed "Title" field to "Page Title". Updated other field names for clarity (e.g., "Search Engine Controls", "Sitemap Controls").
-   **Dependencies:** Updated various dependencies, including Directus packages and adding `reka-ui`.

### Refactoring & Internal Changes

-   Updated Docker configuration (Directus image version, volume mapping, cache settings).
-   Refactored image handling (`OgImage.vue`) to support preview mode and updated related types and utilities.



## 1.0.0 - 2025-02-08

### Initial Release
