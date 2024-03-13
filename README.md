# AI Transcription Operation

Generate transcripts from audio files within Directus Flows with this custom operation, powered by [Deepgram](https://deepgram.com).

![The AI Transcription operation, showing a Deepgram API Key field and a File URL field.](https://raw.githubusercontent.com/directus-labs/extension-ai-transcription-operation/main/docs/options.png)

This operation contains two required configuration options - a [Deepgram API Key](https://console.deepgram.com), and a link to a file. It returns a JSON object containing the transcript, a breakdown of each word and timestamp, a paragraph-formatted transcript, and a breakdown of each paragraph and timestamp.

![The output showing a JSON object containing a transcript and words.](https://raw.githubusercontent.com/directus-labs/extension-ai-transcription-operation/main/docs/output.png)

You can use the operation to then save the result to a file description or item, or run further automation on the output.

## Output

This operation outputs a JSON object with the following structure: 

```json
{
    "confidence": 0.9995117,
    "transcript": "Hi. This is a long string with the full transcript. Complete with punctuation and capitalization."
    "words": [
        {
            "confidence": 0.9995117,
            "word": "word",
            "punctuated_word": "Hi.",
            "start": 0.08,
            "end": 0.3999998,
        }
    ],
    "paragraphs": {
        "transcript": "Hi.\n\nThis is a long string with the full transcript.\n\nComplete with punctuation and capitalization.",
        "paragraphs": [
            {
                "sentences": [
                    {
                        "start": 0.08,
                        "end": 0.3999998,
                        "text": "Hi."
                    }
                ],
                "num_words": 14,
                "start": 0.08,
                "end": 0.7075
            }   
        ]
    }
}
```

## Flow Setup

### Automatically Transcribe New Files

Create a Flow with an **Event Hook** action trigger and a scope of `files.upload`. Use the AI Transciption operation, setting the File URL to `https://your-directus-project-url/assets/{{ $trigger.key }}`, being sure to provide your specific Directus Project URL.

This will work if your file is public, but if it isn't, you can append `?access_token=token` to the File URL, replacing the value with a valid user token that has access to the file.

This operation will trigger on every new file upload, regardless of location or filetype. You may wish to add a conditional step between the trigger and transcription operation. The following condition rule will check that the file is audio:

```json
{
    "$trigger": {
        "payload": {
            "type": {
                "_contains": "audio"
            }
        }
    }
}
```

### Transcribe On-Demand

Create a Flow with a **Manual** trigger and select a collection with a file field, which should contain an audio file. Set the Location to Item Page Only. To receive the file ID create a **Read Data** operation for the same collection, setting IDs to `{{ $trigger.body.keys[0] }}`.

Use the AI Transciption operation, setting the File URL to `https://your-directus-project-url/assets/{{ $last.file_field_name }}`, being sure to provide your specific Directus Project URL and file field name.
