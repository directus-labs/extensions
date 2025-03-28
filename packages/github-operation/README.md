# GitHub Operation
An operation that lets Flows trigger GitHub Actions using the repository_dispatch event.

[](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/github-operation/docs/options.png)

## Configuration
- **Owner**: GitHub user or organization name
- **Repository**: Target repository name
- **Access Token**: GitHub token with appropriate permissions
- **Event type**: Custom event name for workflow filtering
- **Client Payload** : JSON data passed to your workflow

## Flow-Authentication
> [!IMPORTANT]
> Directus Flows can be triggered publicly by default. Add authentication operations if needed.

## Github Setup
1. Create a [GitHub Access Token](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#create-a-repository-dispatch-event)
2. Add a workflow to your repository
3. Create your directus flow

### Example Workflow
```yml
#FILE: .github/workflows/example.yml

name: Directus Dispatched Action

on:
  repository_dispatch:
    # Specify the event types on which the flow should be triggered
    types: [example_event]

jobs:
  example:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # Echo the event name
      - env:
          ACTION: ${{ github.event.action }}
        run: echo $ACTION

      # Echo the Payload
      - env:
          PAYLOAD: ${{ toJSON(github.event.client_payload) }}
        run: echo $PAYLOAD
```
