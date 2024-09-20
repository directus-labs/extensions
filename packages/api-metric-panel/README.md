# Directus API Metric Panel
A panel which allows to display a metric value from an external API.

![](https://raw.githubusercontent.com/directus-labs/extensions/refs/heads/API-Metric-Panel/packages/api-metric-panel/docs/preview.png)

## Installation & Setup
To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).


> [!NOTE]  
> The selected metric will be available through the API for any user with app-access.


## Settings
Once added to a dashboard you can define from where the data should be fetched.

![](https://raw.githubusercontent.com/directus-labs/extensions/refs/heads/API-Metric-Panel/packages/api-metric-panel/docs/settings.png)

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


## Contributing
While developing a tool like [https://webhook.site/](https://webhook.site/) can be used to debug the requests