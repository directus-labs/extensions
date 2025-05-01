
## Installation
Clone the [directus-labs/extensions](https://github.com/directus-labs/extensions) repo if you don't already have it locally available.

```bash
git clone git@github.com:directus-labs/extensions.git

```
```bash
# Navigate to your local Directus core repository 
cd path/to/directus 
git checkout collab-exploration 
git pull 
# Navigate to your local extensions repository 
cd path/to/extensions 
git checkout robl/collaborative-editing-global-awareness 
git pull
```
```bash
# Navigate to your core extensions directory
cd directus-core/api/extensions

# Create a symlink to the collaborative-editing extension
# On Linux/macOS:
ln -s ../../../directus-extensions/packages/collaborative-editing collaborative-editing
```
```bash
# Navigate to the root of directus core
pnpm i && pnpm build

# run the extension in dev mode so it watches changes
cd api/extensions/collaborative-editing
pnpm dev
```

## Directus Setup
Create your collections and make sure to add the Collaboration Settings field to each one.
Create two users.

## Browser Setup
Log in to Directus using two separate browser sessions, one for each user. (Using two separate browsers is probably the easiest way, or you could use the same browser and run one window in incognito)

Navigate to the same collection in both browsers and start typing into an input field. You should see the changes in the other browser.

## Documentation
- [Hocuspocus](https://tiptap.dev/docs/hocuspocus/introduction)
- [Yjs](https://docs.yjs.dev/)
