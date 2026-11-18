export interface Choice {
	text: string;
	value: string;
	description?: string;
	icon_type?: 'icon' | 'svg' | 'image';
	icon?: string;
	svg_icon?: string;
	image?: string;
}

export interface InterfaceProps {
	disabled?: boolean;
	choices: Choice[] | null;
	gridSize?: number;
	width?: string;
	type?: string;
	collection?: string;
	field?: string;
	primaryKey?: string | number;
	enableSearch?: boolean;
}
