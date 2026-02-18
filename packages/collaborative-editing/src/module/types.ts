import { z } from 'zod';

export const EnabledCollections = z.object({
	collection: z.string(),
});

export type EnabledCollectionsType = z.infer<typeof EnabledCollections>;

export const ModuleSettings = z.object({
	enabled_globally: z.boolean().optional().prefault(true),
	hide_current_user_avatar: z.boolean().optional().prefault(false),
	collections: z.array(EnabledCollections),
});

export type CollaborativeEditingConfigType = z.infer<typeof ModuleSettings>;

export const defaultSettings: CollaborativeEditingConfigType = {
	enabled_globally: true,
	hide_current_user_avatar: false,
	collections: [],
};
