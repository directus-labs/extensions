import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'youtube-embed-interface',
	name: 'YouTube Embed',
	icon: 'youtube_activity',
	preview: `<svg width="156" height="96" viewBox="0 0 156 96" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path fill="var(--primary)" d="M105.376 34.246C105.05 33.0351 104.412 31.9311 103.526 31.0444C102.639 30.1578 101.535 29.5196 100.324 29.194C95.87 28 78 28 78 28C78 28 60.13 28 55.676 29.194C54.4651 29.5196 53.3611 30.1578 52.4744 31.0444C51.5878 31.9311 50.9496 33.0351 50.624 34.246C49.43 38.7 49.43 48 49.43 48C49.43 48 49.43 57.3 50.624 61.754C50.9496 62.9649 51.5878 64.0689 52.4744 64.9556C53.3611 65.8422 54.4651 66.4804 55.676 66.806C60.13 68 78 68 78 68C78 68 95.87 68 100.324 66.806C101.535 66.4804 102.639 65.8422 103.526 64.9556C104.412 64.0689 105.05 62.9649 105.376 61.754C106.57 57.3 106.57 48 106.57 48C106.57 48 106.566 38.7 105.376 34.246Z" fill="black"/>
			<path fill="var(--theme--background)" d="M72.28 56.57L87.126 48L72.28 39.43V56.57Z" />
		</svg>`,
	description: 'Search YouTube videos and generate embed codes',
	component: InterfaceComponent,
	options: [
		{
			field: 'apiKey',
			type: 'string',
			name: 'API Key',
			meta: {
				interface: 'input',
				note: 'YouTube Data API v3',
				options: {
					iconRight: 'key',
					font: 'monospace',
					masked: true
				}
			}
		},{
			field: 'channelId',
			type: 'string',
			name: 'Channel ID',
			meta: {
				interface: 'input',
				note: 'Limit searches to a single channel. You can find your channel ID in your advanced YouTube settings.',
				options: {
					iconRight: 'key'
				}
			}
		},{
			field: 'hideSelect',
			type: 'boolean',
			name: 'Selection',
			meta: {
				interface: 'boolean',
				note: 'Prevents selecting a video to embed. Check this if you only want to copy embed codes to your clipboard.',
				options: {
					label: "Hide Select"
				}
			},
			schema: {
				default_value: false,
			},
		}
	],
	types: ['string']
});
