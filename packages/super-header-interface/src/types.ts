export interface FlowIdentifier {
	collection: string;
	key: string;
}

export interface Action {
	label: string;
	icon?: string;
	type?: 'normal' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
	actionType: 'link' | 'flow';
	url?: string;
	flow?: FlowIdentifier;
}

export interface SuperHeaderProps {
	icon?: string;
	title?: string;
	subtitle?: string;
	actions?: Action[];
	help?: string;
	values: Record<string, any>;
	color?: string;
	collection: string;
	primaryKey: string;
}
