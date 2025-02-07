import { options } from '../shared/options';
import InterfaceIconRadio from './interface.vue';

export default {
	id: 'radio-cards-interface',
	name: 'Radio Cards',
	type: 'interface',
	description: 'Radio selection group with icon buttons',
	group: 'selection',
	icon: 'playlist_add_check_circle',
	component: InterfaceIconRadio,
	types: ['string', 'integer', 'float', 'decimal', 'big_integer'],
	recommendedDisplays: ['badge'],
	options,
	preview: `<svg width="156" height="96" viewBox="0 0 156 96" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect x="6.5" y="13.5" width="69" height="69" rx="5.5" fill="var(--theme--background)" stroke="var(--theme--primary)"/>
		<rect x="80.5" y="13.5" width="69" height="69" rx="5.5" fill="var(--theme--background)" stroke="var(--theme--primary)"/>
		<path d="M17.8242 19C14.5976 19 12 21.5976 12 24.8242C12 28.0508 14.5976 30.6484 17.8242 30.6484C21.0508 30.6484 23.6484 28.0508 23.6484 24.8242C23.6484 21.5976 21.0508 19 17.8242 19ZM17.8242 29.5C15.2539 29.5 13.1484 27.3945 13.1484 24.8242C13.1484 22.2539 15.2539 20.1484 17.8242 20.1484C20.3945 20.1484 22.5 22.2539 22.5 24.8242C22.5 27.3945 20.3945 29.5 17.8242 29.5ZM14.8984 24.8242C14.8984 23.2109 16.2109 21.8984 17.8242 21.8984C19.4375 21.8984 20.75 23.2109 20.75 24.8242C20.75 26.4375 19.4375 27.75 17.8242 27.75C16.2109 27.75 14.8984 26.4375 14.8984 24.8242Z" fill="var(--theme--primary)"/>
		<path d="M91 19C87.676 19 85 21.676 85 25C85 28.324 87.676 31 91 31C94.324 31 97 28.324 97 25C97 21.676 94.324 19 91 19ZM91 29.8169C88.3521 29.8169 86.1831 27.6479 86.1831 25C86.1831 22.3521 88.3521 20.1831 91 20.1831C93.6479 20.1831 95.8169 22.3521 95.8169 25C95.8169 27.6479 93.6479 29.8169 91 29.8169Z" fill="var(--theme--primary)" fill-opacity="0.25"/>
		<path d="M52.6667 36.3333V59.6667H29.3333V36.3333H52.6667ZM52.6667 33H29.3333C27.5 33 26 34.5 26 36.3333V59.6667C26 61.5 27.5 63 29.3333 63H52.6667C54.5 63 56 61.5 56 59.6667V36.3333C56 34.5 54.5 33 52.6667 33ZM44.5667 47.7667L39.5667 54.2167L36 49.9L31 56.3333H51L44.5667 47.7667Z" fill="var(--theme--primary)" fill-opacity="0.5"/>
		<path d="M126.667 36.3333V59.6667H103.333V36.3333H126.667ZM126.667 33H103.333C101.5 33 100 34.5 100 36.3333V59.6667C100 61.5 101.5 63 103.333 63H126.667C128.5 63 130 61.5 130 59.6667V36.3333C130 34.5 128.5 33 126.667 33ZM118.567 47.7667L113.567 54.2167L110 49.9L105 56.3333H125L118.567 47.7667Z" fill="var(--theme--primary)" fill-opacity="0.5"/>
		</svg>`,
};
