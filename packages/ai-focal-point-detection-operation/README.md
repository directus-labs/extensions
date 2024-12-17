# AI Focal Point Detection Operation

Determine an image focal point, powered by [OpenAI](https://platform.openai.com/).

![The AI Focal Point Detection operation, showing an Openai API Key field and a File URL field.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/ai-focal-point-detection-operation/docs/options.png)

This operation contains two required configuration options - an [OpenAI API Key](https://platform.openai.com), and a link to a file. It returns a JSON object containing the focal point coordinates and the reason these were chosen.

![The output showing a JSON object containing a a flocal_point_x, focal_point_y, and reason parameter.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/ai-focal-point-detection-operation/docs/output.png)

You can use the operation to then save the result to a file.

## Output

This operation outputs a JSON object with the following structure:

```json
{
    "focal_point_x": 328,
    "focal_point_y": 250,
    "reason": "Centered between the two people on the beach, who are the main subjects of the image."
}
```

Use an Update Data operation to store the `focal_point_x` and `focal_point_y` values on the file object.

## Flow Setup

### Automatically Detect Focal Points For New Files

Create a Flow with an **Event Hook** action trigger and a scope of `files.upload`. Use the AI Focal Point detection operation, setting the File URL to `https://your-directus-project-url/assets/{{ $trigger.key }}`, being sure to provide your specific Directus Project URL.

This will work if your file is public, but if it isn't, you can append `?access_token=token` to the File URL, replacing the value with a valid user token that has access to the file.

This operation will trigger on every new file upload, regardless of location or filetype. You may wish to add a conditional step between the trigger and detection operation. The following condition rule will check that the file is an image:

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

### Detect On-Demand

Create a Flow with a **Manual** trigger and select a collection with a file field, which should contain an image file. Set the Location to Item Page Only. To receive the file ID create a **Read Data** operation for the same collection, setting IDs to `{{ $trigger.body.keys[0] }}`.

Use the AI Focal Point Detection operation, setting the File URL to `https://your-directus-project-url/assets/{{ $last.file_field_name }}`, being sure to provide your specific Directus Project URL and file field name.
