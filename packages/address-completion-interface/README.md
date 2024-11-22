# Address Completion Interface 
This interface includes Google Maps address autocompletion inside of the Directus Editor.

![](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/address-completion-interface/docs/interface.png)

## Installation & Setup
To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

### ENV-Variables
Next you'll need to update your environment variables, in order to allow the app to load data from the google-APIs.


```env
CONTENT_SECURITY_POLICY_DIRECTIVES__SCRIPT_SRC=array:'self', 'unsafe-eval', https://*.googleapis.com
CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC=array:'self', data:, https://*.gstatic.com, https://*.googleapis.com
```

### Google Maps API-Key
The interface needs a valid Google Maps Api-key. Check out the [google documentation](https://developers.google.com/maps/documentation/places/web-service/get-api-key) for detailed information. Make sure to enable the `Places API (new)` in your project

We recommend to:
- Restrict key to your domain
- Restrict services to:
  - Places API (New)
  - Maps JavaScript API


## Interface settings Config
![](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/address-completion-interface/docs/settings.png)

### Autocomplete fetch config
The interface-settings allow you to add a custom request-config for the autocomplete-API. Visit the [google docs](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteRequest.includedRegionCodes) for all available options.

The following example allows to restrict the autocompletion results to US-based results only:

```json
{
    "includedRegionCodes": [
        "us"
    ]
}
```