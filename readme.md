# Meter Component Bundle

Show completion percentage and progress inside the Directus Studio with these progress meter components.

This is a bundle extension that includes an interface and a display.

## Interface

**UI**

![Example view of the meter interface.](https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/interface-example.png)


**Settings**

![Settings screen for the meter interface.](https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/interface-settings.png)


## Display

**UI**

![Example view of the meter display.](https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/display-example.png)


**Settings**

![Settings screen for the meter display.](https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/display-settings.png)


## Quick Overview Video

<div>
    <a href="https://www.loom.com/share/16453b5730f04be4b4e5d85ac42a6197" target="_blank">
      <p>[Directus] Meter Component Extension - Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/16453b5730f04be4b4e5d85ac42a6197" target="_blank">
      <img style="max-width:450px;" src="https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/overview.gif">
    </a>
</div>


# Configuration

This extension works with the following field types.

- Integer
- Decimal
- Float

There are five configuration options.

- **Minimum Value** - The minimum value used to calculate the meter percentage (default: 0).
- **Maximum Value** - The maximum value used to calculate the meter percentage (default: 100).
- **Label** - The label to display below the meter or on hover (for the display).
- **Indicator** - Show an indicator with the current value. ie (50%)
- **Color** - the color of the meter bar. Defaults to the primary theme color.

The components also respect conditional formatting so that you can configure custom percentages, labels, and colors based on a specific value.

![Example view of the meter with conditional formatting.](https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/conditional-example.png)

![Settings screen for the meter with conditional formatting.](https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/conditional-settings.png)
