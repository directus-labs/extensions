import { DeepPartial, Field } from '@directus/types';
import { getRelatimeInterfaceName } from './get-realtime-interface-name';

export function generateRealtimeInterface(collection: string): DeepPartial<Field> {
	return {
		collection,
		field: getRelatimeInterfaceName(collection),
		type: 'alias',
		schema: null,
		meta: {
			special: ['alias', 'no-data'],
			interface: 'presentation-collab-settings-interface',
			width: 'full',
		},
	};
}
