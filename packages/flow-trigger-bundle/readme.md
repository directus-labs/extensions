# Flow Trigger Bundle

The Flow Trigger Bundle enhances manual flow triggers within the Directus Data Studio by providing configurable panels and interfaces for triggering flows directly. This bundle includes a Flows Panel and a Flows Interface, each designed to streamline the execution of manual flows within the Directus environment.

![Flow Trigger Interface Sample](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/flow-trigger-bundle/docs/screenshots.png)

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions) for details on installing the extension from the Marketplace or manually.

## Usage

### Flows Panel

The Flows Panel allows users to configure and run manual flows directly from the panel. Users can select multiple flows with manual triggers, assign custom button labels, and input item IDs. These item IDs can be hardcoded or dynamically sourced from a relational global variable panel within the same dashboard.

The panel automatically filters flows, displaying only those triggered by collections where the user has read permissions. The Flow's internal permissions are respected during execution. Additionally, the panel supports native flow confirmation dialogs and allows manual sorting of flow trigger buttons.

### Flows Interface

The Flows Interface enables users to configure and trigger manual flows directly from within a collection interface. Similar to the Flows Panel, users can select and sort multiple manual flows to be triggered from the interface. The configured flows will appear as a button group in the Directus editor.

The interface also supports native flow confirmation dialogs, ensuring that users can safely execute their flows.

## Configuration

### Flows Panel

1. Add the Flows Panel to your dashboard.
2. Configure one or more manual flows you wish to trigger.
3. Assign custom labels to the buttons.
4. Input a hardcoded item IDs or use a dynamic values from a relational global variable panel.
5. Arrange the flow trigger buttons in the desired order.
6. Save and use the panel to trigger flows based on your configuration.

### Flows Interface

1. Add the Flows Interface to your collection editor.
2. Select one or more manual flows to trigger within this interface.
3. Arrange the flow trigger buttons in the desired order.
4. Save and trigger the flows directly from the interface.
