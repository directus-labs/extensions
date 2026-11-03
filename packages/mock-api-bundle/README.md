# Directus Mock API

Create mock API endpoints from Studio, so you can build frontend work against APIs that don't exist yet.

## Install

Requires Directus 12. Refer to the official guide for installing the extension from the Marketplace or manually. The bundle includes an API endpoint and hook that aren't sandboxed, so installing it from the Marketplace requires `MARKETPLACE_TRUST=all`.

When Directus starts, the extension creates its own hidden collections (`mock_api_*`).

Enable the **Mock API** module under **Settings → Project Settings → Modules**. Only admins can see it.

## Use

1. Open **Mock API** and create a collection, or click **Add example** to start from a sample tasks API.
2. Give the collection a prefix, such as `tasks-api`. Every endpoint in it is served under `/mock/<prefix>`.
3. Add endpoints. Each one needs a method, a path and one or more responses (status and JSON body). Pick the **active response** to switch what the endpoint returns, for example from a `200` to a `500`.
4. Call it:

```sh
curl -H "Authorization: Bearer <token>" https://your-project/mock/tasks-api/tasks/5
```

Use the **Test request** panel on an endpoint to try it without leaving Studio. **Log** shows the last 50 requests and which endpoint answered each one.

### Paths

- `:name` captures a path segment, e.g. `/tasks/:id`.
- A trailing `*` matches the rest of the path, which must have at least one more segment.
- **Query** limits an endpoint to requests that include those values, e.g. `shared=true`.
- When several endpoints match, the most specific one answers.

### Response tokens

Response bodies can include these tokens:

| Token            | Value                          |
| ---------------- | ------------------------------ |
| `{{params.id}}`  | A path param                   |
| `{{query.name}}` | A query string value           |
| `{{body.title}}` | A field from the request body  |
| `{{now}}`        | The current time (ISO 8601)    |
| `{{uuid}}`       | A new UUID                     |

Tokens can go inside quotes or where a number goes, e.g. `{"id": {{params.id}}}`. An empty body returns `204`.

**Delay** waits the given number of milliseconds before responding (30 seconds at most), which helps when testing loading states.

### Import and export

**Transfer** exports collections as a JSON file and imports them into another project. When an imported prefix already exists, choose how to handle it:

- **Merge**: add new endpoints and update matching ones, keeping the rest.
- **Replace**: delete the existing collection and import the file's version.
- **Copy**: import it alongside, with a new prefix such as `tasks-api-2`.

Each import shows a preview of the changes before you apply it.

## Settings

**Require a signed-in user** (Mock API → Settings) is on by default. With it on, mock routes need a valid access token, like any other Directus route. Turn it off only on projects where anonymous access is acceptable.

## Development

```sh
pnpm dev        # rebuild on change
pnpm test       # run tests
pnpm validate   # type check
```
