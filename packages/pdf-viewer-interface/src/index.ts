import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";
import { defaultButtonLabel } from "./default-button-label";

export default defineInterface({
    id: "directus-labs-pdf-viewer-interface",
    name: "PDF Viewer",
    icon: "picture_as_pdf",
    description: "View PDF files from within the item editor modified by prodanet",
    component: InterfaceComponent,
    types: ["alias"],
    localTypes: ["presentation"],
    group: "presentation",
    hideLabel: true,
    hideLoader: true,
    autoKey: true,
    options: ({ collection }) => {
        return [
            {
                field: "file_field",
                type: "string",
                name: "PDF Field",
                meta: {
                    width: "full",
                    interface: "system-field",
                    options: {
                        collectionName: collection,
                        typeAllowList: ["uuid"],
                    }
                },
            },
            {
                field: "button_label",
                name: "Button Label",
                meta: {
                    width: "full",
                    interface: "system-input-translated-string",
                    options: { placeholder: defaultButtonLabel },
                },
            }
        ];
    },
});
