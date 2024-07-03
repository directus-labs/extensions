# RSS to JSON Operation

Return a RSS Feed as a JSON object inside of Flows with this custom operation.

Provide a URL of an RSS feed, and have an object returned wit the parsed output of the RSS feed.

## Output

The output of the operation is a JSON representation of the XML document.

Many properties have been omitted, but valid podcast feeds will always return a `channel` containing show metadata. Each episode will be returned inside of the `item` array.

```json
{
    "?xml": {
        "_version": "1.0",
        "_encoding": "UTF-8"
    },
    "rss": {
        "channel": {
            "title": "Darknet Diaries",
            "link": "https://darknetdiaries.com/",
            "pubDate": "Tue, 02 Jul 2024 07:00:00 -0000",
            "language": "en-us",
            "copyright": "Jack Rhysider",
            "itunes:author": "Jack Rhysider",
            "itunes:type": "episodic",
            "itunes:category": {
                "_text": "Technology"
            },
            "itunes:image": {
                "_href": "https://f.prxu.org/7057/images/68ff605a-20f3-437f-9ba9-2d17316724b1/uploads_2F1562951997273-pdd2keiryql-99f75240ab90a579e25720d85d3057b2_2Fdarknet-diaries-rss.jpg"
            },
            "itunes:explicit": false,
            "itunes:owner": {
                "itunes:email": "podcast@darknetdiaries.com",
                "itunes:name": "Jack Rhysider"
            },
            "itunes:subtitle": "True stories from the dark side of the Internet",
            "itunes:summary": "Explore true stories of the dark side of the Internet with host Jack Rhysider as he takes you on a journey through the chilling world of hacking, data breaches, and cyber crime.",
            "item": [{
                "guid": {
                    "#text": "prx_7057_e5f7b7f2-b242-4a5e-ac8e-c689f537e570",
                    "_isPermaLink": "false"
                },
                "title": "147: Tornado",
                "pubDate": "Tue, 02 Jul 2024 07:00:00 -0000",
                "link": "https://darknetdiaries.com/episode/147",
                "description": "<p>In this episode, Geoff White (https://x.com/geoffwhite247) tells us what happened to Axie Infinity and Tornado cash. It’s a digital heist of epic proportions that changes everything.<br><br>This story comes from part of Geoff’s book “Rinsed” which goes into the world of money laundering. Get yours here https://amzn.to/3VJs7pb.</p>",
                "enclosure": {
                    "_url": "https://www.podtrac.com/pts/redirect.mp3/dovetail.prxu.org/7057/e5f7b7f2-b242-4a5e-ac8e-c689f537e570/DD_EP147.mp3",
                    "_type": "audio/mpeg",
                    "_length": "82259660"
                },
                "itunes:title": "Tornado",
                "itunes:season": 1,
                "itunes:episode": 147,
                "itunes:duration": "01:25:33",
                "itunes:author": "Jack Rhysider",
                "itunes:summary": "In this episode, Geoff White (https://x.com/geoffwhite247) tells us what happened to Axie Infinity and Tornado cash. It’s a digital heist of epic proportions that changes everything.This story comes from part of Geoff’s book “Rinsed” which goes into the world of money laundering. Get yours here https://amzn.to/3VJs7pb.",
                "itunes:image": {
                    "_href": "https://f.prxu.org/7057/e5f7b7f2-b242-4a5e-ac8e-c689f537e570/images/baefe978-c3da-4c38-bb92-84795b1e7704/tornado.jpg"
                },
            }]
        }
    }
}
```

Attributes are provided inside of an object prepended with `_`. For example `<enclosure url="http://example.com/file.mp3" type="audio/mpeg" />` becomes:

```json
{
    "enclosure": {
        "_url": "http://example.com/file.mp3",
        "_type": "audio/mpeg"
    }
}
```
