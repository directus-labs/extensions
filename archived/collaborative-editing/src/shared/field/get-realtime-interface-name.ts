import { REALTIME_INTERFACE_NAME_PREFIX } from '../constants';

export function getRealtimeInterfaceName(collection: string) {
	return REALTIME_INTERFACE_NAME_PREFIX + collection;
}
