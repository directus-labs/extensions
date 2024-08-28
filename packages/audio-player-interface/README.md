# Audio Interface for Directus

An interface to select an audio source and display an audio player from an URL or a local file from Directus.

![The audio interface, showing an open service drop-down with the options Directus and External URL, with External URL selected, an audio ID in the nearby text field, and an audio player below the field.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/audio-player-interface/docs/preview.png)

## Installation & Setup

To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

To make external audio sources work, update your **CSP directives** as follows:

```env
# For all domains
CONTENT_SECURITY_POLICY_DIRECTIVES__MEDIA_SRC=array:'self', *

# OR for specific domains
CONTENT_SECURITY_POLICY_DIRECTIVES__MEDIA_SRC=array:'self', specific.domain.com, example.com
```

Once installed, go to your data model settings, create a new field or update an existing field of the type `json`, and select `Audio` as the interface.

## Usage

Locate the audio field on your item page and select an audio source: Directus or URL. If you choose Directus, select an existing audio file from the file library. If you are using external audio, paste in the URL. The audio player will now appear, and if it exists, you can play it directly from the item page.

## Output

```js
// Example output for external audio from URL
{ service: 'url', source: 'https://example.com/audio.mp3' }

// Example output for local audio files from Directus
{ service: 'directus', source: '09fe994b-01b5-4dea-9535-e7a14cfc0398' }
```
