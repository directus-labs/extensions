import { options } from '../shared/options';
// index.ts
import InterfaceCheckboxCards from './interface.vue';

export default {
	id: 'checkbox-cards-interface',
	name: 'Checkbox Cards',
	type: 'interface',
	group: 'selection',
	description: 'Checkbox selection group with icon buttons',
	icon: 'fact_check',
	component: InterfaceCheckboxCards,
	types: ['json', 'csv'],
	recommendedDisplays: ['labels'],
	options,
	preview: `<svg width="156" height="96" viewBox="0 0 156 96" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="6.5" y="13.5" width="69" height="69" rx="5.5" fill="var(--theme--background)" stroke="var(--theme--primary)"/>
		<rect x="80.5" y="13.5" width="69" height="69" rx="5.5" fill="var(--theme--background)" stroke="var(--theme--primary)"/>
		<path d="M52.6667 36.3333V59.6667H29.3333V36.3333H52.6667ZM52.6667 33H29.3333C27.5 33 26 34.5 26 36.3333V59.6667C26 61.5 27.5 63 29.3333 63H52.6667C54.5 63 56 61.5 56 59.6667V36.3333C56 34.5 54.5 33 52.6667 33ZM44.5667 47.7667L39.5667 54.2167L36 49.9L31 56.3333H51L44.5667 47.7667Z" fill="var(--theme--primary)" fill-opacity="0.5"/>
		<path d="M126.667 36.3333V59.6667H103.333V36.3333H126.667ZM126.667 33H103.333C101.5 33 100 34.5 100 36.3333V59.6667C100 61.5 101.5 63 103.333 63H126.667C128.5 63 130 61.5 130 59.6667V36.3333C130 34.5 128.5 33 126.667 33ZM118.567 47.7667L113.567 54.2167L110 49.9L105 56.3333H125L118.567 47.7667Z" fill="var(--theme--primary)" fill-opacity="0.5"/>
		<path d="M21.324 19H13.176C12.52 19 12 19.52 12 20.176V28.324C12 28.98 12.52 29.5 13.176 29.5H21.324C21.981 29.5 22.5 28.98 22.5 28.324V20.176C22.5 19.52 21.98 19 21.324 19ZM21.324 28.324H13.176V20.176H21.324V28.324ZM20.75 22.5L19.93 21.68L16.074 25.508L14.57 24.004L13.75 24.852L16.074 27.176L20.75 22.5Z" fill="var(--theme--primary)"/>
		<path d="M95.324 20.176V28.324H87.176V20.176H95.324ZM95.324 19H87.176C86.52 19 86 19.52 86 20.176V28.324C86 28.981 86.52 29.5 87.176 29.5H95.324C95.981 29.5 96.5 28.98 96.5 28.324V20.176C96.5 19.519 95.98 19 95.324 19Z" fill="var(--theme--primary)" fill-opacity="0.25"/>
		</svg>
		`,
};
