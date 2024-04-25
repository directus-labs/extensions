# Meter Componenent Bundle

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

<video controls width="500">
<source src="https://raw.githubusercontent.com/directus-labs/extension-meter-component/main/docs/directus-meter-extension-component-bundle.mp4" type="video/mp4" />
</video>

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
