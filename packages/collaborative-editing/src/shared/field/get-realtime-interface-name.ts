import { REALTIME_INTERFACE_NAME_PREFIX } from '../constants';

export function getRelatimeInterfaceName(collection: string) {
	return REALTIME_INTERFACE_NAME_PREFIX + collection;
}
