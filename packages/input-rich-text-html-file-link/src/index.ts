import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'input-rich-text-html-file-link',
	name: 'WYSIWYG (Add/Edit File Link)',
	icon: 'format_quote',
	description: 'WYSIWYG Interface Extension for Directus, Extended with a more powerful add/edit file link interface',
	component: InterfaceComponent,
	types: ['text'],
	group: 'standard',
	options: {
		standard: [
			{
				field: 'toolbar',
				name: '$t:interfaces.input-rich-text-html.toolbar',
				type: 'json',
				schema: {
					default_value: [
						'bold',
						'italic',
						'underline',
						'h1',
						'h2',
						'h3',
						'numlist',
						'bullist',
						'removeformat',
						'blockquote',
						'customLink',
						'customImage',
						'fileLink',
						'customMedia',
						'hr',
						'code',
						'fullscreen',
					],
				},
				meta: {
					width: 'half',
					interface: 'select-multiple-dropdown',
					options: {
						choices: [
							{
								value: 'undo',
								text: '$t:wysiwyg_options.undo',
							},
							{
								value: 'redo',
								text: '$t:wysiwyg_options.redo',
							},
							{
								value: 'bold',
								text: '$t:wysiwyg_options.bold',
							},
							{
								value: 'italic',
								text: '$t:wysiwyg_options.italic',
							},
							{
								value: 'underline',
								text: '$t:wysiwyg_options.underline',
							},
							{
								value: 'strikethrough',
								text: '$t:wysiwyg_options.strikethrough',
							},
							{
								value: 'subscript',
								text: '$t:wysiwyg_options.subscript',
							},
							{
								value: 'superscript',
								text: '$t:wysiwyg_options.superscript',
							},
							{
								value: 'fontfamily',
								text: '$t:wysiwyg_options.fontselect',
							},
							{
								value: 'fontsize',
								text: '$t:wysiwyg_options.fontsizeselect',
							},
							{
								value: 'h1',
								text: '$t:wysiwyg_options.h1',
							},
							{
								value: 'h2',
								text: '$t:wysiwyg_options.h2',
							},
							{
								value: 'h3',
								text: '$t:wysiwyg_options.h3',
							},
							{
								value: 'h4',
								text: '$t:wysiwyg_options.h4',
							},
							{
								value: 'h5',
								text: '$t:wysiwyg_options.h5',
							},
							{
								value: 'h6',
								text: '$t:wysiwyg_options.h6',
							},
							{
								value: 'alignleft',
								text: '$t:wysiwyg_options.alignleft',
							},
							{
								value: 'aligncenter',
								text: '$t:wysiwyg_options.aligncenter',
							},
							{
								value: 'alignright',
								text: '$t:wysiwyg_options.alignright',
							},
							{
								value: 'alignjustify',
								text: '$t:wysiwyg_options.alignjustify',
							},
							{
								value: 'alignnone',
								text: '$t:wysiwyg_options.alignnone',
							},
							{
								value: 'indent',
								text: '$t:wysiwyg_options.indent',
							},
							{
								value: 'outdent',
								text: '$t:wysiwyg_options.outdent',
							},
							{
								value: 'numlist',
								text: '$t:wysiwyg_options.numlist',
							},
							{
								value: 'bullist',
								text: '$t:wysiwyg_options.bullist',
							},
							{
								value: 'forecolor',
								text: '$t:wysiwyg_options.forecolor',
							},
							{
								value: 'backcolor',
								text: '$t:wysiwyg_options.backcolor',
							},
							{
								value: 'removeformat',
								text: '$t:wysiwyg_options.removeformat',
							},
							{
								value: 'cut',
								text: '$t:wysiwyg_options.cut',
							},
							{
								value: 'copy',
								text: '$t:wysiwyg_options.copy',
							},
							{
								value: 'paste',
								text: '$t:wysiwyg_options.paste',
							},
							{
								value: 'remove',
								text: '$t:wysiwyg_options.remove',
							},
							{
								value: 'selectall',
								text: '$t:wysiwyg_options.selectall',
							},
							{
								value: 'blockquote',
								text: '$t:wysiwyg_options.blockquote',
							},
							{
								value: 'customLink',
								text: '$t:wysiwyg_options.link',
							},
							{
								value: 'unlink',
								text: '$t:wysiwyg_options.unlink',
							},
							{
								value: 'customImage',
								text: '$t:wysiwyg_options.image',
							},
							{
								value: 'fileLink',
								text: 'Add/Edit File Link',
							},
							{
								value: 'customMedia',
								text: '$t:wysiwyg_options.media',
							},
							{
								value: 'table',
								text: '$t:wysiwyg_options.table',
							},
							{
								value: 'hr',
								text: '$t:wysiwyg_options.hr',
							},
							{
								value: 'code',
								text: '$t:wysiwyg_options.source_code',
							},
							{
								value: 'fullscreen',
								text: '$t:wysiwyg_options.fullscreen',
							},
							{
								value: 'visualaid',
								text: '$t:wysiwyg_options.visualaid',
							},
							{
								value: 'ltr rtl',
								text: '$t:wysiwyg_options.directionality',
							},
						],
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
							{ text: '$t:sans_serif', value: 'sans-serif' },
							{ text: '$t:monospace', value: 'monospace' },
							{ text: '$t:serif', value: 'serif' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
			{
				field: 'folder',
				name: '$t:folder',
				type: 'uuid',
				meta: {
					width: 'half',
					interface: 'system-folder',
					note: '$t:interfaces.input-rich-text-html.folder_note',
				},
			},
			{
				field: 'imageToken',
				name: '$t:interfaces.input-rich-text-html.imageToken',
				type: 'string',
				meta: {
					note: '$t:interfaces.input-rich-text-html.imageToken_label',
					width: 'half',
					interface: 'input',
				},
			},
		],
		advanced: [
			{
				field: 'softLength',
				name: '$t:soft_length',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: '255',
						min: 1,
					},
				},
			},
			{
				field: 'customFormats',
				name: '$t:interfaces.input-rich-text-html.custom_formats',
				type: 'json',
				meta: {
					interface: 'code',
					note: '$t:interfaces.input-rich-text-html.custom_formats_note',
					options: {
						language: 'json',
						template: JSON.stringify(
							[
								{
									title: 'My Custom Format',
									inline: 'span',
									classes: 'custom-wrapper',
									styles: {
										'color': '#00ff00',
										'font-size': '20px',
									},
									attributes: { title: 'My Custom Wrapper' },
								},
							],
							null,
							4,
						),
					},
				},
			},
			{
				field: 'tinymceOverrides',
				name: '$t:interfaces.input-rich-text-html.options_override',
				type: 'json',
				meta: {
					interface: 'code',
					note: '$t:interfaces.input-rich-text-html.options_override_note',
					options: {
						language: 'json',
						template: JSON.stringify(
							{
								font_size_formats:
                                    '8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt',
								font_family_formats:
                                    'Arial=arial,helvetica,sans-serif; Courier New=courier new,courier,monospace;',
							},
							null,
							4,
						),
					},
				},
			},
		],
	},
	preview: `<svg width="156" height="96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="15" width="120" height="66" rx="6" fill="var(--theme--background)" class="glow" /><rect x="19" y="16" width="118" height="64" rx="5" stroke="var(--theme--primary)" stroke-width="2" /><rect x="28" y="25" width="8" height="8" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="42" y="25" width="8" height="8" rx="2" fill="var(--theme--primary)" /><rect x="56" y="25" width="8" height="8" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="70" y="25" width="8" height="8" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="84" y="25" width="8" height="8" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="98" y="25" width="8" height="8" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="39" width="60" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="59" width="60" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="28" y="49" width="40" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /><rect x="92" y="39" width="30" height="6" rx="2" fill="var(--theme--primary)" /><rect x="72" y="49" width="50" height="6" rx="2" fill="var(--theme--primary)" fill-opacity=".25" /></svg>`,
});
