# Realtime Collaboration Extension

A realtime extension that enables data synchronization across collections.

# Requirements

- Directus 11.8.0+
- [WebSockets enabled](https://directus.io/docs/configuration/realtime)

# Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

## Directus Setup

- Login to the Directus admin panel.
- Go to the Settings page and enable the Realtime Collaboration module.
- Navigate to the Realtime Collaboration Settings page and enable the extension. This will enable realtime collaboration for all user-created collections, as well as the `directus_users` and `directus_files` collections.

# Local Development

## Installation

Clone the [directus-labs/extensions](https://github.com/directus-labs/extensions) repo if you don't already have it locally available.

```bash
git clone git@github.com:directus-labs/extensions.git

```

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

```bash
# Navigate to your core extensions directory
cd PATH_TO_DIRECTUS_CORE/api/extensions

# Create a symlink to the collaborative-editing extension
# On Linux/macOS:
ln -s PATH_TO_DIRECTUS_LABS_EXTENSIONS/packages/collaborative-editing collaborative-editing
```

```bash
# Navigate to the root of directus core
pnpm i && pnpm build

# run the extension in dev mode so it watches changes
cd PATH_TO_DIRECTUS_CORE/api/extensions/collaborative-editing
pnpm i && pnpm dev
```

## Architecture

### Frontend

- **Field Registry**: Manages field detection and activation/deactivation
- **Awareness Store**: Tracks user presence and active fields using Pinia
- **Avatar Components**: Displays user avatars and collaboration indicators
- **Provider System**: Handles WebSocket communication and Y.js document management

### Backend

- **WebSocket Handler**: Manages real-time connections and message routing
- **Permission Sanitization**: Ensures users only receive updates for fields they can access
- **Room Management**: Organizes users into collection-based rooms
- **Save Coordination**: Handles distributed save operations
