# Changelog

## 1.2.0 (2025-05-02)

### New Features
- Relational support for values in title, subtitle, and link actions
- Added intelligent handling of dialog positioning within drawers
- Added automatic item change detection after flow execution
- Added reload confirmation dialog when item data is changed by a flow
- Support for showing help content in a modal vs inline
- Added comprehensive translation support for interface elements and help content


### Fixes
- Fixed issue with primary key handling in flow execution
- Fixed dialog stacking when opening drawers from dialogs
- Fixed issue where dialogs would remain open after flow execution
- Improved error handling for API requests

## 1.1.1 (2025-02-21)

### Fixes
- Fixed issue when running flows from action buttons from within nested relational items.

## 1.1.0 (2025-01-28)

### Fixes
- Fixed issue when running flows from action buttons
- Added proper handling of action button types (primary, secondary, info, success, warning, danger)
- Added better error handling for flow execution

### Improvements
- Enhanced help content display with HTML support and toggle functionality
- Improved responsive design for header actions

### Notes
- Actions with type "Flow" require appropriate permissions and proper collection to execute the selected Flow
