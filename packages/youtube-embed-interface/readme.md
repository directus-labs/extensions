# YouTube Embed Interface

Add a field to your collection for searching and embedding YouTube videos. You can also copy embed codes from the drawer directly, so you can paste them elsewhere.

![Screenshot of the YouTube Interface in action](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/youtube-embed-interface/docs/preview.png)

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

## Usage

Select YouTube Embed as your interface when creating a new field in a collection.

You also need a **YouTube Data API V3** key from Google Cloud Console:

1. In Google Cloud console, visit [APIs & Services](https://console.cloud.google.com/apis)
2. Select a project if needed and go to Library.
3. Look for YouTube Data API V3 and click on Enable.
4. Open Credentials and click on Create Credentials, select API key.
5. Paste the API key into the interface settings.

By default this will allow you to search any public video on YouTube and create an embed. If you want to limit the selection to a single channel, you can specify a channel ID in the interface settings (note: this is not the same as your channel handle). 

You can find your own channel ID by following [these instructions](https://support.google.com/youtube/answer/3250431?hl=en&sjid=5754630783709979667-EU). To find other channel's IDs you may have to use a third party tool.