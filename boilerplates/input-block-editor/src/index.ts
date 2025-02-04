import { defineInterface } from '@directus/extensions';
import InterfaceBlockEditor from './input-block-editor.vue';

export default defineInterface({
	id: 'custom-input-block-editor',
	name: 'Custom Block Editor',
	description: '$t:interfaces.input-block-editor.description',
	icon: 'code',
	component: InterfaceBlockEditor,
	types: ['json'],
	group: 'standard',
	options: [
		{
			field: 'placeholder',
			name: '$t:placeholder',
			meta: {
				width: 'half',
				interface: 'text-input',
				options: {
					placeholder: '$t:enter_a_placeholder',
				},
			},
		},
		{
			field: 'font',
			name: '$t:font',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				options: {
					choices: [
						{
							text: '$t:sans_serif',
							value: 'sans-serif',
						},
						{
							text: '$t:monospace',
							value: 'monospace',
						},
						{
							text: '$t:serif',
							value: 'serif',
						},
					],
				},
			},
			schema: {
				default_value: 'sans-serif',
			},
		},
		{
			field: 'tools',
			name: '$t:interfaces.input-block-editor.tools',
			type: 'json',
			schema: {
				default_value: [
					'header',
					'nestedlist',
					'code',
					'image',
					'paragraph',
					'checklist',
					'quote',
					'underline',
				],
			},
			meta: {
				width: 'half',
				interface: 'select-multiple-dropdown',
				options: {
					choices: [
						// EXAMPLE (Part 1/4): add marker tool
						// Install `npm add -D @editorjs/marker`

						// EXAMPLE (Part 2/4): add marker tool
						// {
						//     value: "marker",
						//     text: "Marker",
						// },
						{
							value: 'header',
							text: '$t:interfaces.input-block-editor.tools_options.header',
						},
						{
							value: 'nestedlist',
							text: '$t:interfaces.input-block-editor.tools_options.nestedlist',
						},
						{
							value: 'embed',
							text: '$t:interfaces.input-block-editor.tools_options.embed',
						},
						{
							value: 'paragraph',
							text: '$t:interfaces.input-block-editor.tools_options.paragraph',
						},
						{
							value: 'code',
							text: '$t:interfaces.input-block-editor.tools_options.code',
						},
						{
							value: 'image',
							text: '$t:interfaces.input-block-editor.tools_options.image',
						},
						{
							value: 'attaches',
							text: '$t:interfaces.input-block-editor.tools_options.attaches',
						},
						{
							value: 'table',
							text: '$t:interfaces.input-block-editor.tools_options.table',
						},
						{
							value: 'quote',
							text: '$t:interfaces.input-block-editor.tools_options.quote',
						},
						{
							value: 'underline',
							text: '$t:interfaces.input-block-editor.tools_options.underline',
						},
						{
							value: 'inlinecode',
							text: '$t:interfaces.input-block-editor.tools_options.inlinecode',
						},
						{
							value: 'delimiter',
							text: '$t:interfaces.input-block-editor.tools_options.delimiter',
						},
						{
							value: 'checklist',
							text: '$t:interfaces.input-block-editor.tools_options.checklist',
						},
						{
							value: 'toggle',
							text: '$t:interfaces.input-block-editor.tools_options.toggle',
						},
						{
							value: 'alignment',
							text: '$t:interfaces.input-block-editor.tools_options.alignment',
						},
						{
							value: 'raw',
							text: '$t:interfaces.input-block-editor.tools_options.raw',
						},
					],
				},
			},
		},
		{
			field: 'bordered',
			name: '$t:displays.formatted-value.border',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.border_label',
				},
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'folder',
			name: '$t:interfaces.system-folder.folder',
			type: 'uuid',
			meta: {
				width: 'full',
				interface: 'system-folder',
				note: '$t:interfaces.system-folder.field_hint',
			},
		},
	],
	preview: `<svg width="156" height="96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="15" width="120" height="66" rx="6" fill="var(--theme--background)" class="glow" /><rect x="19" y="16" width="118" height="64" rx="5" stroke="var(--theme--primary)" stroke-width="2" /><rect x="28" y="25" width="6" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="45.148" width="6" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="55.222" width="6" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="65.296" width="6" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="35.074" width="6" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="42" y="25" width="10" height="6" rx="2" fill="var(--theme--primary)" /><rect x="46" y="35" width="50" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="46" y="45" width="60" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="46" y="55" width="40" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="42" y="65" width="10" height="6" rx="2" fill="var(--theme--primary)" /></svg>`,
});
