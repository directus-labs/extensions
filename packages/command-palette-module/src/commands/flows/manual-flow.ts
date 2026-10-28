import type { Flow, PrimaryKey } from '@directus/types';
import type { Ref } from 'vue';
import formatTitle from '@directus/format-title';
import { unref } from 'vue';

export interface ManualFlowConfirmDetails {
	description: any;
	fields: Record<string, any>[];
}

interface ManualFlowPayloadBase {
	collection: string;
	values: Record<string, any> | null;
}

type ManualFlowPayloadOptions = ManualFlowPayloadBase & (
	| { location: 'collection'; primaryKey?: never }
	| { location: 'item'; primaryKey: Ref<PrimaryKey | null> }
);

type TriggerManualFlowOptions = ManualFlowPayloadOptions & {
	api: { post: (url: string, body: Record<string, any>) => Promise<unknown> };
	flow: Flow;
};

export function getManualFlowConfirmDetails(flow: Flow | null | undefined): ManualFlowConfirmDetails | null {
	if (!flow?.options?.requireConfirmation) return null;

	return {
		description: flow.options.confirmationDescription,
		fields: (flow.options.fields ?? []).map((field: Record<string, any>) => ({
			...field,
			name: !field.name && field.field ? formatTitle(field.field) : field.name,
		})),
	};
}

export function isManualFlowConfirmButtonDisabled(
	flowId: string | null,
	confirmDetails: ManualFlowConfirmDetails | null,
	confirmValues: Record<string, any> | null,
) {
	if (!flowId) return true;

	return (confirmDetails?.fields ?? []).some(
		(field) =>
			field.meta?.required
			&& (!confirmValues || confirmValues[field.field] === null || confirmValues[field.field] === undefined),
	);
}

export function getManualFlowTriggerPayload(options: ManualFlowPayloadOptions) {
	if (options.location === 'collection') return { ...options.values, collection: options.collection };

	const primaryKey = unref(options.primaryKey);
	return {
		...options.values,
		collection: options.collection,
		keys: primaryKey === null ? [] : [primaryKey],
	};
}

export function triggerManualFlow(options: TriggerManualFlowOptions) {
	const { api, flow } = options;
	const payload = options.location === 'item'
		? getManualFlowTriggerPayload({
				collection: options.collection,
				values: options.values,
				location: options.location,
				primaryKey: options.primaryKey,
			})
		: getManualFlowTriggerPayload({
				collection: options.collection,
				values: options.values,
				location: options.location,
			});

	return api.post(`/flows/trigger/${flow.id}`, payload);
}

export function canRunManualFlowFromCommandPalette(flow: Flow, location: 'collection' | 'item') {
	return location === 'item' || flow.options?.requireSelection === false;
}
