import type { Ref } from 'vue';
import type { SeoFieldRule, SeoFieldState, SeoFieldStatus } from '../types/seo';
import { computed, ref } from 'vue';
import { renderTemplate } from '../utils';

export interface SeoFieldStateWithIcon extends SeoFieldState {
	icon: {
		name: string;
		class: string;
	};
}

export const STATUS_CONFIG = {
	'missing': {
		icon: { name: 'error', class: 'error' },
		message: 'Missing',
	},
	'too-long': {
		icon: { name: 'warning', class: 'warning' },
		message: 'Too long',
	},
	'too-short': {
		icon: { name: 'warning', class: 'warning' },
		message: 'Too short',
	},
	'ideal': {
		icon: { name: 'check', class: 'success' },
		message: 'Ideal length',
	},
};

export function useSeoField(
	modelValue: Ref<string | undefined | null>,
	rule: SeoFieldRule | undefined,
	values: Ref<Record<string, any>> = ref({}),
) {
	const length = computed(() => modelValue.value?.length ?? 0);

	const progress = computed(() => {
		if (!modelValue.value || !rule)
			return 0;
		return Math.min((length.value / rule.maxLength) * 100, 100);
	});

	const status = computed<SeoFieldStatus>(() => {
		if (!modelValue.value || !rule)
			return 'missing';
		if (length.value > rule.maxLength)
			return 'too-long';
		if (length.value < rule.minLength)
			return 'too-short';
		return 'ideal';
	});

	const state = computed<SeoFieldStateWithIcon>(() => {
		const currentStatus = status.value;
		const statusConfig = STATUS_CONFIG[currentStatus];

		return {
			length: length.value,
			progress: progress.value,
			status: currentStatus,
			message: statusConfig.message,
			icon: statusConfig.icon,
		};
	});

	function transform(value: string) {
		if (!value)
			return '';

		return renderTemplate(value, values.value);
	}

	return {
		state,
		transform,
	};
}
