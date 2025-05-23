import { Field } from '@directus/types';
import { getRelatimeInterfaceName } from './get-realtime-interface-name';

export function isRealtimeInterface(field: Field) {
	return (
		field.field === getRelatimeInterfaceName(field.collection) ||
		field.meta?.interface === 'presentation-realtime-settings-interface'
	);
}
