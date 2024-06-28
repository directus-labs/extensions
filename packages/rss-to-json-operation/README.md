# RSS to JSON Operation

Return a RSS Feed as a JSON object inside of Flows with this custom operation.

Provide a URL of a feed, and have an object returned. Attributes are provided inside of an object prepended with `_`. For example:

```
<enclosure url="http://example.com/file.mp3" type="audio/mpeg" />

// becomes
{
    "enclosure": {
        "_url": "http://example.com/file.mp3",
        "_type": "audio/mpeg"
    }
}
```
