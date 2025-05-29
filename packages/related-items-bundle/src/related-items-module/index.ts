import { defineModule } from '@directus/extensions-sdk';
import { injectRelatedItemsField } from './utils/inject-related-items-field';

export default defineModule({
	id: 'related-items',
	hidden: true,
	name: 'Related Items',
	icon: 'hub',
	routes: [],
	preRegisterCheck(user) {
    const admin = user.admin_access;
    if (!admin) return false;
		injectRelatedItemsField();
		return true;
	},
});