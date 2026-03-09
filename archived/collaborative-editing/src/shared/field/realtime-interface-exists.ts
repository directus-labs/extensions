import { Field } from '@directus/types';
import { isRealtimeInterface } from './is-realtime-interface';

export function realtimeInterfaceExists(fields: Field[]) {
	return fields.some(isRealtimeInterface);
}
