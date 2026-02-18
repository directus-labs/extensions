import { DeepPartial, Field } from '@directus/types';
import { getRealtimeInterfaceName } from './get-realtime-interface-name';

export function generateRealtimeInterface(collection: string): DeepPartial<Field> {
	return {
		collection,
		field: getRealtimeInterfaceName(collection),
		type: 'alias',
		schema: null,
		meta: {
			special: ['alias', 'no-data'],
			interface: 'presentation-collab-settings-interface',
			width: 'full',
		},
	};
}
