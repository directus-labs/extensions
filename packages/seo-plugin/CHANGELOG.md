# Changelog

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
