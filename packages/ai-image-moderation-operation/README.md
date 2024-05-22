# AI Image Moderation Operation

Analyze images for drugs, suggestive or explicit material, powered by Clarifai.

![The AI Image Moderation operation, showing a Clarifai API Token field, File URL, and threshold](https://raw.githubusercontent.com/directus-labs/extension-ai-image-moderation-operation/main/docs/options.png)

This operation contains four configuration options - a [Clarifai API Key](https://clarifai.com/settings/security), a link to a file, and a threshold percentage for the concepts to be 'flagged'. It returns a JSON object containing a score for each concept, and an array of which concepts are over the threshold.

![The output showing a JSON object containing a list of conecpts with values, and an array of flagged concepts.](https://raw.githubusercontent.com/directus-labs/extension-ai-text-intelligence-operation/main/docs/output.png)

## Output

This operation outputs a JSON object with the following structure:

```json
{
  "concepts": [
    {
      "name": "drug",
      "value": "99.99"
    },
    {
      "name": "suggestive",
      "value": "0.00"
    },
    {
      "name": "gore",
      "value": "0.00"
    },
    {
      "name": "explicit",
      "value": "0.00"
    }
  ],
  "flags": [
    "drug"
  ]
}
```

## Flow Setup

### Automatically Moderate New Files

Create a Flow with an **Event Hook** action trigger and a scope of `files.upload`. Use the AI Image Moderation operation, setting the File URL to `https://your-directus-project-url/assets/{{ $trigger.key }}`, being sure to provide your specific Directus Project URL.

This will work if your file is public, but if it isn't, you can append `?access_token=token` to the File URL, replacing the value with a valid user token that has access to the file.

This operation will trigger on every new file upload, regardless of location or filetype. You may wish to add a conditional step between the trigger and moderation operation. The following condition rule will check that the file is an image:

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
