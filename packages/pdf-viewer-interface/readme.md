# PDF Viewer Interface

View PDF files from within the item editor.

![An active overlay that displays a rendered PDF page](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/pdf-viewer-interface/docs/preview.png)

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

Make sure to update your environment variables to include **CSP directives** as follows:

```env
CONTENT_SECURITY_POLICY_DIRECTIVES__SCRIPT_SRC=array:'self' data:
```

In a `docker-compose.yml` file, add the following the the `environment` section:

```yaml
CONTENT_SECURITY_POLICY_DIRECTIVES__SCRIPT_SRC: "array:'self' data:"
```

## Usage

Add the `PDF Viewer` via the interface selector, select the `PDF Field` you want to display the PDF from in the interface settings. On your item page, select a PDF from the above mentioned `PDF Field` and click the `Open PDF` button – you can also change the button label in the interface settings.
