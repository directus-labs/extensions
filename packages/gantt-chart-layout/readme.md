# Gantt Chart Layout

This layout displays items in a collection that have a start and end date field, and displays them in a gantt chart. Powered by [Frappe Gantt](https://frappe.io/gantt).

![Screenshot of the Gantt Chart Layout in action](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/gantt-chart-layout/docs/preview.png)

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

## Usage

Select Gantt Chart as your collection layout, then be sure to select which field you would like to use as your Label Field, Start Date Field and End Date Field. Optionally, you can assign a Many To One-field as a Dependency Field, this will draw a line between related items in the chart.