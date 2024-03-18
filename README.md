# AI Text Extraction Operation

Extract text from image files within Directus Files with this custom operation, using [Clarifai](https://www.clarifai.com).

![Sample output](https://raw.githubusercontent.com/directus-labs/extension-ai-alt-text-writer/main/docs/options.png)

This operation requires two options to be set - first a personal access token from [Clarifai](https://www.clarifai.com) (you can find this in your personal settings under [Security](https://clarifai.com/settings/security)), and a link to the image file. It will return a JSON object, with all the found text into a single merged string and a list of regions where the texts were found.

You can use the operation to then save the result to a file description or item, or run further automation on the output.

## Output

This operation outputs a JSON object with the following structure:

```json
{
  "text": "DIGGING\nTHE RABBIT HOLE",
  "regions": [
    {
      "id": "1e3fcaca88308d377d567966e4ae1dda",
      "region_info": {
        "bounding_box": {
          "top_row": 0.6302083,
          "left_col": 0.102489024,
          "bottom_row": 0.703125,
          "right_col": 0.32796484
        }
      },
      "data": {
        "text": {
          "raw": "DIGGING",
          "text_info": {
            "encoding": "UnknownTextEnc"
          }
        }
      },
      "value": 0.9584053
    },
      ...
  ]
}
```

## Flow Setup

### Automatically Extract Text From New Files

Create a Flow with an **Event Hook** action trigger and a scope of `files.upload`. Use the AI Text Extraction operation, setting the File URL to `https://your-directus-project-url/assets/{{ $trigger.key }}`, being sure to provide your specific Directus Project URL.

This will work if your file is public, but if it isn't, you can append `?access_token=token` to the File URL, replacing the value with a valid user token that has access to the file.

This operation will trigger on every new file upload, regardless of location or filetype. You may wish to add a conditional step between the trigger and transcription operation. The following condition rule will check that the file is an image:

```json
{
    "$trigger": {
        "payload": {
            "type": {
                "_contains": "image"
            }
        }
    }
}
```

### Extract Text On-Demand

Create a Flow with a **Manual** trigger and select a collection with a file field, which should contain an image file. Set the Location to Item Page Only. To receive the file ID create a **Read Data** operation for the same collection, setting IDs to `{{ $trigger.body.keys[0] }}`.

Use the AI Text Extraction operation, setting the File URL to `https://your-directus-project-url/assets/{{ $last.file_field_name }}`, being sure to provide your specific Directus Project URL and file field name.
