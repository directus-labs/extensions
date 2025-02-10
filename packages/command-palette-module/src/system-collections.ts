import type { SearchCollectionType } from './types';

export const systemCollections: SearchCollectionType[] = [
	{
		collection: 'directus_users',
		fields: ['email', 'first_name', 'last_name'],
		descriptionField: 'email',
		thumbnailField: 'avatar',
		limit: 10,
		availableGlobally: false,
	},
];
