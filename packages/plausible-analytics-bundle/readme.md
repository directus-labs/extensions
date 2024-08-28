# Plausible Analytics Bundle

![plausible-bundle.png](https://raw.githubusercontent.com/directus-labs/extensions/packages/plausible-analytics-bundle/main/docs/plausible-bundle.png)

[Plausible](https://plausible.io/?ref=directus) is an intuitive, privacy-friendly analytics alternative to Google Analytics.

With this extension, you can embed your Plausible dashboard right within your Directus project. **Put your analytics right where they belong – alongside your actual content.** No more context switching or jumping between websites.

This bundle includes:

- An interface to display the Plausible dashboard in the item detail / form page.
- A panel to display the Plausible dashboard within your Directus dashboards.

---

## Interface

![plausible-interface-example.png](https://raw.githubusercontent.com/directus-labs/extensions/packages/plausible-analytics-bundle/main/docs/plausible-interface-example.png)

### **Configuration Options**

![plausible-interface-config.png](https://raw.githubusercontent.com/directus-labs/extensions/packages/plausible-analytics-bundle/main/docs/plausible-interface-config.png)

**Shared Link URL** (*required)

Create a shared link for your Plausible dashboard and paste the URL here.

Here’s an example of what the URL looks like.
`https://plausible.io/share/yourdomain.net?auth=fadfhlkadjl83c`

The URL can be found in your Plausible settings for your domain.

Learn more about shared links within the [Plausible documentation](https://plausible.io/docs/shared-links?ref=directus).

**Page URL Filter** (optional)

This field allows you to filter the Plausible dashboard by a specific page. Check performance for a page from your frontend like the home page, pricing page, or other high value page right in the context of where the content is stored.

Can pull values dynamically based on your item page.

---

## Panel

![plausible-panel-example.png](https://raw.githubusercontent.com/directus-labs/extensions/packages/plausible-analytics-bundle/main/docs/plausible-panel-example.png)

### **Configuration Options**

![plausible-panel-config.png](https://raw.githubusercontent.com/directus-labs/extensions/packages/plausible-analytics-bundle/main/docs/plausible-panel-config.png)

**Shared Link URL** (* required)

Create a shared link for your Plausible dashboard and paste the URL here.

Here’s an example of what the URL looks like.
`https://plausible.io/share/yourdomain.net?auth=fadfhlkadjl83c`

The URL can be found in your Plausible settings for your domain.

Learn more about shared links within the [Plausible documentation](https://plausible.io/docs/shared-links?ref=directus).

---

## Installation & Setup

To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

To enable embedding, you’ll need to update your CSP directives within your [Directus Config](https://docs.directus.io/self-hosted/config-options.html#security) as follows:

```
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC='https://*.plausible.io, https://plausible.io'
CONTENT_SECURITY_POLICY_DIRECTIVES__SCRIPT_SRC="array:'self', plausible.io 'unsafe-eval' 'unsafe-inline'"
```
