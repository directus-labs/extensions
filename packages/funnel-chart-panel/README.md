# Directus Funnel Chart Panel

Present a list of numbers in an ascending or descending funnel chart.

![Funnel Chart Panel](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/funnel-chart-panel/docs/directus-panel-funnel-chart.jpg)

## Usage

The chart will be rendered within the new panel. While small, the graph won't show legends or labels. Hover over data points to reveal the value (if enabled).

You can change the following options:

- Collection Selection
- Filters
- Label Field
- Value Field
- Group Aggregation (Sum, Average, Count, Max and Min)
- Sort Direction
- Hide/Show Labels
- Hide/Show Tooltips
- Color

## Requirements

- Directus 10.10.0+
- String field for Label
- Integer, BigInteger, Float or Decimal field for Value
- Fields must be in the same table

### Example

|  Platform  |  Visits  | Date |
|------------|----------|------|
| Website | 76 | 2024-10-02 |
| Social | 10 | 2024-10-02 |
| Website | 100 | 2024-10-03 |
| Social | 30 | 2024-10-03 |
| Website | 96 | 2024-10-04 |
| Social | 38 | 2024-10-04 |

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## How to add this Panel

1. Create a new Panel and select **Funnel Chart** from the list
2. Choose the collection and the fields to use for the Label and Value
3. (Optional) Filter the data to your scope
4. (Optional) Select how to Aggregate the data
5. (Optional) Use the header to create a name for this panel
6. Save the panel and position/resize as required
7. Save the dashboard

![Customise the panel](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/funnel-chart-panel/docs/directus-panel-funnel-chart-customize.jpg)


## Permissions

This extension uses the current session permissions and will only show the permitted data.
