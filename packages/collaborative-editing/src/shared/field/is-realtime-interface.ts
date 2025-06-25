import { Field } from '@directus/types';
import { getRealtimeInterfaceName } from './get-realtime-interface-name';

export function isRealtimeInterface(field: Field) {
	return (
		field.field === getRealtimeInterfaceName(field.collection) ||
		field.meta?.interface === 'presentation-realtime-settings-interface'
	);
}
