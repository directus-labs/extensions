import { z } from 'zod';
import { Filter } from '@directus/types';

export const SearchCollection = z.object({
	collection: z.string(),
	displayTemplate: z.string().optional().nullable(),
	descriptionField: z.string().optional().nullable(),
	fields: z.array(z.string().min(1, "field name cannot be empty")),
    filter: z.object({}).nullable().or(z.undefined()) as z.ZodType<Filter>,
	sort: z.string().optional().nullable(),
	limit: z.number().gte(-1, 'greater than or equal to -1').nullable(),
});

export const SearchConfig = z.object({
	searchMode: z.enum(['as_you_type', 'form_submit'], {
		errorMap: () => ({ message: 'either as_you_type or form_submit' }),
	}),
	recentSearchLimit: z.number().gte(-1, "greater than or equal to -1"),
	rememberLastSearch: z.boolean({
        errorMap: () => ({ message: 'boolean / true or false' }),
    }),
	collections: z.array(SearchCollection),
	triggerRate: z.number().gte(0, 'greater than or equal to 0').optional(),
});

export const SearchHistoryItem = z.object({
    query: z.string().min(1, "query cannot be empty"),
	timestamp: z.number(),
});

export const SearchResult = z.object({
	collection: z.string(),
	hits: z.array(z.record(z.any())),
	displayTemplate: z.string().optional().nullable(),
	descriptionField: z.string().optional().nullable(),
});

export const defaultSettings: SearchConfig = {
	searchMode: 'as_you_type',
	recentSearchLimit: 25,
	rememberLastSearch: true,
	collections: [],
	triggerRate: 500,
};

export type SearchCollection = z.infer<typeof SearchCollection>;
export type SearchConfig = z.infer<typeof SearchConfig>;
export type SearchHistoryItem = z.infer<typeof SearchHistoryItem>;
export type SearchResult = z.infer<typeof SearchResult>;
