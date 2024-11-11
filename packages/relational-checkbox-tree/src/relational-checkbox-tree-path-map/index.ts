import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'relational-checkbox-tree-options-path-map',
	name: 'Relational Checkbox Tree Path Mapping',
	icon: 'box',
	description: 'This is my custom interface!',
	component: InterfaceComponent,
	options: [
    {
      field: 'parentCollection',
      name: 'Parent Collection',
      type: 'string',
      meta: {
        interface: 'system-collection',
        options: {
          includeSystem: false,
        },
        width: 'full',
      },
    },
    {
      field: 'template',
      name: 'Template',
      type: 'string',
      meta: {
        width: 'full',
      },
    },
  ],
	types: ['json'],
});
