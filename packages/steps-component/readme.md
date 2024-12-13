# Steps Interface Extension

Displays a clickable list of steps that the user can follow to complete a task within the Directus Studio.

## Interface
steps-interface-example.png
**UI**

![Example view of the steps interface.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/steps-component/docs/steps-interface-example.png)

**Settings**

![Settings screen for the steps interface.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/steps-component/docs/steps-interface-settings-steps.png)

![Settings screen for the fields within each step interface.](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/steps-component/docs/steps-interface-settings-fields.png)

### Configuration Options

- **Steps** - Define the list of steps to display.

Each step includes:
- **Text** - The label to display (string, required).
- **Value** - The value that gets stored (string or integer, required).
- **Icon** - The icon to display (optional).
