import type { Filter } from '@directus/types';
import { z } from 'zod';

export const SearchCollection = z.object({
	collection: z.string(),
	displayTemplate: z.string().optional().nullable(),
	descriptionField: z.string().optional().nullable(),
	thumbnailField: z.string().optional().nullable(),
	fields: z.array(z.string().min(1, 'field name cannot be empty')),
	filter: z.object({}).optional().nullable() as z.ZodNullable<z.ZodOptional<z.ZodType<Filter>>>,
	sort: z.string().optional().nullable(),
	limit: z.number().gte(-1, 'greater than or equal to -1').nullable(),
	availableGlobally: z.boolean().optional().prefault(false),
});

export const ModuleSettings = z.object({
	searchMode: z.enum(['as_you_type', 'on_submit'], {
		error: () => 'either as_you_type or on_submit',
	}),
	collections: z.array(SearchCollection),
	triggerRate: z.number().gte(0, 'greater than or equal to 0').optional(),
	commandPaletteEnabled: z.boolean().optional().prefault(true),
	recentSearchLimit: z.number().gte(0, 'greater than or equal to 0').optional(),
});

interface CollectionSearchInfo {
	collection: string;
	displayTemplate: string;
	descriptionField: string;
	primaryKeyField: string;
}

export type CollectionSearchResult = CollectionSearchInfo & {
	hits: Record<string, any>[];
};

export const defaultSettings: SearchConfigType = {
	searchMode: 'as_you_type',
	collections: [],
	triggerRate: 100,
	commandPaletteEnabled: true,
	recentSearchLimit: 5,
};

export type SearchCollectionType = z.infer<typeof SearchCollection>;
export type SearchConfigType = z.infer<typeof ModuleSettings>;
