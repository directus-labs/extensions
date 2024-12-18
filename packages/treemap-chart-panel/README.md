# Directus Treemap Chart Panel

Present a cluster or boxes where the size of each box represent the value. You can also group data into categories which are presented in different colors.

![Treemap Chart Panel](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/treemap-chart-panel/docs/directus-panel-treemap-chart.jpg)

## Usage

The graph will be rendered within the new panel. While small, the graph won't show legends or labels. Hover over data points to reveal the value (if enabled).

If you choose to group the data into different series, a legend will appear at the bottom. Hover over a series in the legend to highlight all data for that series. You can also toggle which series are visible by clicking the series label in the legend.

You can change the following options:

- Collection Selection
- Filters
- Label Field
- Value Field
- Group Aggregation (Sum, Average, Count, Max and Min)
- Series Field
- Hide/Show Labels
- Hide/Show Tooltips
- Color

## Requirements

- Directus 10.10.0+
- String field for the Label and Series
- Integer, BigInteger, Float or Decimal field for Value
- Fields must be in the same table

### Example

|  Platform  |  Visits  |  Country  | Date |
|------------|----------|-----------|------|
| Website | 76 | USA | 2024-10-02 |
| Social | 10 | USA | 2024-10-02 |
| Website | 100 | USA | 2024-10-03 |
| Social | 30 | USA | 2024-10-03 |
| Website | 96 | UK | 2024-10-03 |
| Social | 38 | UK | 2024-10-03 |

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## How to add this Panel

1. Create a new Panel and select **Treemap Chart** from the list
2. Choose the collection and the fields to use for the Labels and Values
3. (Optional) Filter the data to your scope
4. Select how to Aggregate the data
5. (Optional) Select the field to Group data into series
6. (Optional) Use the header to create a name for this panel
7. Save the panel and position/resize as required
8. Save the dashboard

![Customise the panel](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/treemap-chart-panel/docs/directus-panel-treemap-chart-customize.jpg)


## Permissions

This extension uses the current session permissions and will only show the permitted data.
