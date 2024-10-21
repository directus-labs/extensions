import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'relational-checkbox-tree-options',
	name: 'Relational Checkbox Tree Options',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	types: ["json"],
  group: "relational",
	options: [
    {
      field: "parentCollection",
      name: "Parent Collection",
      type: "string",
      meta: {
        interface: "system-collection",
        options: {
          includeSystem: false,
        },
        width: "full",
      },
    },
  ],
});
