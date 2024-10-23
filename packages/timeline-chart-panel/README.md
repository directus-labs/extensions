# Directus Timeline Chart Panel

Present a series of tasks or events with a start and end date on a graph. You can also group data into categories on the y axis and seperate tasks into different colors.

![Timeline Chart Panel](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/timeline-chart-panel/docs/directus-panel-timeline-chart.jpg)

## Usage

The graph will be rendered within the new panel. While small, the graph won't show legends or labels. Hover over data points to reveal the value (if enabled).

If you choose to split the task/event into different series, a legend will appear at the bottom. Hover over a series in the legend to highlight all data for that series. You can also toggle which series are visible by clicking the series label in the legend.

You can change the following options:

- Collection Selection
- Filters
- Y Label
- Start and End Dates
- Display Text on the task/event
- Grouping
- Color
- Hide/Show Tooltips
- Data Labels

## Requirements

- Directus 10.10.0+
- DateTime, Date or Timestamp field for Date Start and Date End fields
- String field for Y Axis Labels
- Fields must be in the same table

### Example

|  Label  |  Start  |  End  | User | Task |
|---------|---------|-------|------|------|
| Design | 2024-09-02 | 2024-09-12 | Brian | UI Mockup |
| Design | 2024-09-08 | 2024-09-16 | Sarah | DB Schema Design |
| Code | 2024-09-19 | 2024-10-08 | Michelle | Frontend Development |
| Code | 2024-09-14 | 2024-10-12 | Robert | Core Development |
| Test | 2024-10-20 | 2024-10-31 | Ben | Frontend Testing |
| Test | 2024-10-18 | 2024-10-26 | Kate | Cybersecurity Testing |

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## How to add this Panel

1. Create a new Panel and select **Timeline Chart** from the list
2. Choose the collection and the fields to use for the Label, Start and End Dates
3. (Optional) Filter the data to your scope
4. (Optional) Select the field to Group data into series
5. (Optional) Select the field for the Task/Event names
6. (Optional) Use the header to create a name for this panel
7. Save the panel and position/resize as required
8. Save the dashboard

![Customise the panel](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/timeline-chart-panel/docs/directus-panel-timeline-chart-customize.jpg)


## Permissions

This extension uses the current session permissions and will only show the permitted data.
