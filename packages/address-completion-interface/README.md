# Address Completion Interface for Directus
A Directus interface that integrates Google Maps address autocompletion functionality into the Directus Editor.

![](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/address-completion-interface/docs/interface.png)

## Features
- Google Maps address autocompletion
- Customizable autocompletion configuration
- Display the result on a map (optionally)

## Prerequisites
- A Directus installation
- Google Maps API key with appropriate permissions
- Access to your Directus environment variables

## Installation
To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

## Configuration
### 1. Environment Variables
Add the following environment variables to your config file, in order to allow the app to load data from the google-APIs:

```env
CONTENT_SECURITY_POLICY_DIRECTIVES__SCRIPT_SRC=array:'self', 'unsafe-eval', https://*.googleapis.com
CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC=array:'self', data:, https://*.gstatic.com, https://*.googleapis.com
````

### 2. Google Maps API Setup
1. Obtain a Google Maps API key from the Google Cloud Console. View [Google documentation](https://developers.google.com/maps/documentation/places/web-service/get-api-key)
2. Enable the following APIs in your Google Cloud project:
   - Places API (New)
   - Maps JavaScript API

**Recommended Security Measures:**

- Restrict the API key to your domain
- Enable only the required services (Places API and Maps JavaScript API)

## Interface Configuration
![](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/address-completion-interface/docs/settings.png)

### Autocomplete Settings
You can customize the autocomplete behavior using the interface settings. The configuration accepts standard Google Places Autocomplete parameters as documented in the [Google Maps JavaScript API Reference](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteRequest.includedRegionCodes).

Example Configuration:

```json
{
    "includedRegionCodes": [
        "us"
    ]
}
```
This example restricts autocomplete results to US addresses only.

### Support
For issues and feature requests, please use the GitHub issues section of this repository.