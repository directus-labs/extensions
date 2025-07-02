# Collaborative Editing

![Collaborative editing thumbnail](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/collaborative-editing/docs/collaborative-post.png)

A powerful realtime collaboration extension that enables simultaneous data editing and synchronization across collections in Directus. Experience seamless collaborative editing with real-time user awareness, conflict resolution, and visual indicators showing who's editing what.

**Features**

- **Real-time collaborative editing** with instant synchronization across multiple users
- **Smart field locking** prevents conflicts by locking fields when someone else is editing them
- **Visual user awareness** with avatars showing who's currently editing
- **Relationship support** works seamlessly with relational fields and page builders
- **Universal compatibility** functions in collections, file library, and user directory
- **Flexible deployment** with global or selective collection-based enabling
- **Permission-aware** respects user access controls and field-level permissions
- **Conflict-free editing** using Y.js CRDT technology for seamless collaboration
- **Professional interface** with clean visual indicators and smooth user experience

## Overview Video

[![Overview Video](https://img.youtube.com/vi/R2Tx35sLm3I/0.jpg)](https://www.youtube.com/watch?v=R2Tx35sLm3I)

## Installation

To install the extension, follow the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for installing extensions from the Marketplace or manually.

[![Installation Video](https://img.youtube.com/vi/tEylJunuwJA/0.jpg)](https://www.youtube.com/watch?v=tEylJunuwJA)

**Important Note: While this extension is developed by our Directus core team, it is not sandboxed.**

If you want to install from the Directus Marketplace, set the `MARKETPLACE_TRUST` variable in your [Directus Configuration](https://directus.io/docs/configuration/extensions#marketplace) to `all`.

Be extremely careful about installing any extensions from untrusted sources. [Learn more about extensions and the sandboxed extensions](https://directus.io/docs/guides/extensions/api-extensions/sandbox).


## Requirements

- **Directus 11.8.0+** - This extension requires Directus version 11.8.0 or higher
- **[WebSockets enabled](https://directus.io/docs/configuration/realtime)** - WebSocket support must be configured in your Directus instance for real-time functionality. Verify the `WEBSOCKETS_ENABLED=true` environment variable is set


## Usage

### Initial Setup

1. **Install the Extension**:
   - Install the Realtime Collaboration extension through the Directus Marketplace or manually with NPM.
   `@directus-labs/collaborative-editing`

2. **Enable the Module within Settings**:
   - Navigate to the Settings -> Module Bar and enable the Collaborative Editing module.

     ![Collaborative editing module bar settings](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/collaborative-editing/docs/collaborative-settings-module-bar.png)
   - Don't forget to save the settings.


3. **Configure Collaborative Editing**:
   - Navigate to the Collaborative Editing module. If collaborative editing settings haven't been added to Directus yet, the extension will prompt to create them automatically for you.
   - By default, collaborative editing is enabled globally, which is the easiest approach and will work across all collections, including the file library and user directory.

     ![Collaborative editing settings page](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/collaborative-editing/docs/collaborative-settings-page.png)

### How It Works

Once enabled, the extension provides seamless collaborative editing:

- **Real-time User Awareness**: See other users' avatars when they're editing the same item
- **Field-Level Locking**: Users are automatically locked out of fields that others are actively editing, preventing conflicts
- **Live Updates**: All changes appear instantly across all connected users
- **Relationship Support**: Works seamlessly with relational fields and complex structures like page builders
- **Visual Indicators**: Avatar indicators and field highlighting show who's editing what and when
- **Automatic Integration**: The extension automatically injects collaboration interfaces into your collections

## Configuration Options

### Enabling Collaborative Editing

There are two approaches to enable collaborative editing:

#### Global Approach (Recommended)
- **Enable Collaborative Editing Globally** - Toggle to enable collaboration across all collections, file library, and user directory
- This is the default and easiest method
- Works immediately across your entire Directus instance

#### Selective Approach
- Disable global collaboration in the module settings
- Add the Collaboration interface to specific collections where you want collaborative editing
- Navigate to your collection's data model settings
- Search for and add the "Collaboration" interface to enable it for that collection only
- Might be better approach for instances with sensitive data or anytime where you want more granular control

### Automatic Setup

The extension automatically creates necessary settings fields, injects collaboration interfaces into new collections, configures WebSocket message handlers, and sets up user awareness tracking.


## Local Development

### Installation

Clone the [directus-labs/extensions](https://github.com/directus-labs/extensions) repo if you don't already have it locally available.

```bash
git clone git@github.com:directus-labs/extensions.git
```

### Setup Development Environment

```bash
# Navigate to your local Directus core repository
cd PATH_TO_DIRECTUS_CORE
git checkout main
git pull

# Navigate to your local extensions repository
cd PATH_TO_DIRECTUS_LABS_EXTENSIONS
git checkout main
git pull
```

### Create Symlink

```bash
# Navigate to your core extensions directory
cd PATH_TO_DIRECTUS_CORE/api/extensions

# Create a symlink to the collaborative-editing extension
# On Linux/macOS:
ln -s PATH_TO_DIRECTUS_LABS_EXTENSIONS/packages/collaborative-editing collaborative-editing
```

### Development Build

```bash
# Navigate to the root of directus core
pnpm i && pnpm build

# Run the extension in dev mode so it watches changes
cd PATH_TO_DIRECTUS_CORE/api/extensions/collaborative-editing
pnpm i && pnpm dev
```

## Logging and Debugging

To enable detailed logging, add the `REALTIME_LOGS_ENABLED=true` environment variable to your `.env` file.

The extension provides logging for WebSocket connections, user join/leave events, field activation/deactivation, save coordination events, and error handling.


## Notes

- The extension automatically creates necessary database fields and configurations
- Real-time features require active WebSocket connections
- Save operations are coordinated to prevent conflicts during simultaneous editing
- User permissions are respected and enforced at the field level
- The extension is optimized for performance with efficient message filtering and room management
