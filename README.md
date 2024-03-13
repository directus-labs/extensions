# AI Text Intelligence Operation

Analyze text within Directus Flows with this customer operation, powered by Deepgram. Understand intents, sentiment, topics, and generate a summary.

![The AI Text Intelligence operation, showing a Deepgram API Key field and a text field](https://raw.githubusercontent.com/directus-labs/extension-ai-text-intelligence-operation/main/docs/options.png)

This operation contains two required configuration options - a [Deepgram API Key](https://console.deepgram.com), and some text. It returns a JSON object containing sentiment average and per segment, intent per segment, topics per segment, and an overall summary of the text.

![The output showing a JSON object containing a summary and topics.](https://raw.githubusercontent.com/directus-labs/extension-ai-text-intelligence-operation/main/docs/output.png)

## Output

This operation outputs a JSON object with the following structure:

```json
{
    "summary": {
        "text": "Jake calls the Honda dealership and speaks with Josh about the new Honda Civic 2023. Jake schedules a test drive for the hybrid model on Friday and provides his contact information. Josh confirms the appointment and tells Jake to call if he has any further questions."
    },
    "topics": {
        "segments": [
            {
                "text": "Hi I'm calling to get a refund on my recent purchase. Sure I'd be happy to help you with that. What was the number for you order?",
                "start_word": 0,
                "end_word": 26,
                "topics": [
                    { "topic": "Refund", "confidence_score": 0.91318 },
                    { "topic": "Order Number", "confidence_score": 0.95342 }
                ]
            }
        ]
    },
    "intents": {
      "segments": [
        {
          "text": "I also need to update my address.",
          "start_word": 12,
          "end_word": 18,
          "intents": [
            {
              "intent": "Update address",
              "confidence_score": 0.6320186
            }
          ]
        }
      ]
    },
    "sentiments": {
      "segments": [
        {
          "text": "Hi. Thank you for calling from premier phone services.",
          "start_word": 0,
          "end_word": 8,
          "sentiment": "positive",
          "sentiment_score": 0.7380304336547852
        }
      ],
      "average": {
        "sentiment": "positive",
        "sentiment_score": 0.39790084145285864
      }
    }
}
```
