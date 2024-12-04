import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
    id: "directus-labs-experimental-m2a-interface",
    name: "Builder (M2A) Button Matrix",
    icon: "grid_view",
    description: "Add a matrix button selector to the built-in M2A interface",
    component: InterfaceComponent,
    types: ["alias"],
    localTypes: ["presentation"],
    group: "presentation",
    options: [
        {
            field: "target",
            name: "Target Builder (M2A) field placement",
            type: "string",
            meta: {
                width: "full",
                interface: "select-dropdown",
                options: {
                    choices: [
                        {
                            text: "Above this field",
                            value: "above",
                            icon: "vertical_align_top",
                        },
                        {
                            text: "Below this field",
                            value: "below",
                            icon: "vertical_align_bottom",
                        },
                    ],
                },
            },
            schema: {
                default_value: "below",
            },
        },
        {
            field: "info",
            type: "alias",
            meta: {
                width: "full",
                interface: "presentation-notice",
                conditions: [
                    {
                        rule: { _and: [{ target: { _eq: "below" } }] },
                        options: {
                            text: svgNotice({ targetPlacedBelow: true }),
                        },
                    },
                ],
                options: {
                    icon: false,
                    text: svgNotice({ targetPlacedBelow: false }),
                },
            },
        },
        {
            field: "enableSearch",
            name: "Enable Search",
            type: "boolean",
            meta: {
                width: "half",
                interface: "boolean",
            },
            schema: {
                default_value: false,
            },
        },
        {
            field: "searchPlaceholder",
            name: "Search Placeholder",
            type: "string",
            meta: {
                width: "half",
                interface: "input",
                hidden: true,
                conditions: [
                    {
                        rule: { enableSearch: { _eq: true } },
                        hidden: false,
                    },
                ],
            },
            schema: {
                default_value: "Search...",
            },
        },

    ],
});

function svgNotice({ targetPlacedBelow }: { targetPlacedBelow: boolean }) {
    const svg = `<svg style="vertical-align:middle" width="120" height="50" viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M114 1H6C3.23858 1 1 3.23858 1 6V16C1 18.7614 3.23858 21 6 21H114C116.761 21 119 18.7614 119 16V6C119 3.23858 116.761 1 114 1Z" stroke="var(--theme--primary)" stroke-opacity="${
        targetPlacedBelow ? "1" : "0.25"
    }" stroke-width="2"/><path d="M114 29H6C3.23858 29 1 31.2386 1 34V44C1 46.7614 3.23858 49 6 49H114C116.761 49 119 46.7614 119 44V34C119 31.2386 116.761 29 114 29Z" stroke="var(--theme--primary)" stroke-opacity="${
        targetPlacedBelow ? "0.25" : "1"
    }" stroke-width="2"/><path opacity="${
        targetPlacedBelow ? "0.5" : "1"
    }" d="M20 37H10V38.2691H20V37ZM10 40.7778H20V39.5087H10V40.7778Z" fill="var(--theme--primary)"/><path opacity="${
        targetPlacedBelow ? "1" : "0.5"
    }" d="M20 9H10V10.2691H20V9ZM10 12.7778H20V11.5087H10V12.7778Z" fill="var(--theme--primary)"/><text opacity="${
        targetPlacedBelow ? "1" : "0.5"
    }" fill="var(--theme--primary)" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="10" font-weight="500" letter-spacing="0em"><tspan x="28" y="14.6364">${
        targetPlacedBelow ? "Button Matrix" : "Builder (M2A)"
    }</tspan></text><text opacity="${
        targetPlacedBelow ? "0.5" : "1"
    }" fill="var(--theme--primary)" xml:space="preserve" style="white-space: pre" font-family="Inter" font-size="10" font-weight="500" letter-spacing="0em"><tspan x="28" y="42.6364">${
        targetPlacedBelow ? "Builder (M2A)" : "Button Matrix"
    }</tspan></text></svg>`;

    const text = `<span style="padding-left: 12px">Place this field directly ${
        targetPlacedBelow ? "above" : "below"
    } the Builder (M2A) field!</span>`;

    return `${svg}${text}`;
}
