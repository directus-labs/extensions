import { z } from 'zod';

export const ModuleSettings = z.object({
	collaborativeEditingEnabled: z.boolean().optional().default(true),
});

export type CollaborativeEditingConfigType = z.infer<typeof ModuleSettings>;

export const defaultSettings: CollaborativeEditingConfigType = {
	collaborativeEditingEnabled: true,
};
