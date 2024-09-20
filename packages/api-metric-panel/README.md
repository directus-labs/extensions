# Directus API Metric Panel
A panel which allows to display a metric value from an external API.

## Installation & Setup
To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

## Settings
Once added to a dashboard you can define from where the data should be fetched.

In the result-path you can define the path to your desired value in a dot-notation. If your endpoint for example returns this JSON-response:

```json
{
  "user": "directus",
  "pull_count": 35786947,
  "nested_data": {
    "nested_one": 12,
  }
}
```

you can select `nested_one` by using `nested_data.nested_one` as your request path.

Other settings as request-headers, a custom request-body and a bunch of styling options are available too.