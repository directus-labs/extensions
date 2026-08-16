// @vitest-environment happy-dom

import type { Flow } from '@directus/types';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import RunFlow from './run-flow.vue';

const mocks = vi.hoisted(() => ({
	apiPost: vi.fn(),
	close: vi.fn(),
	goBack: vi.fn(),
	notify: vi.fn(),
	unexpectedError: vi.fn(),
}));

vi.mock('@directus/extensions-sdk', () => ({
	useApi: () => ({ post: mocks.apiPost }),
	useStores: () => ({
		useNotificationsStore: () => ({ add: mocks.notify }),
	}),
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('vue-router', () => ({
	useRoute: () => ({ params: { collection: 'articles', primaryKey: '1' } }),
}));

vi.mock('../../command-palette', () => ({
	useCommandContext: () => ({ close: mocks.close }),
}));

vi.mock('../../command-palette/router/router', () => ({
	useCommandRouter: () => ({ pop: mocks.goBack }),
}));

vi.mock('../../composables/use-unexpected-error', () => ({
	useUnexpectedError: () => mocks.unexpectedError,
}));

const ButtonStub = defineComponent({
	props: { disabled: Boolean, loading: Boolean },
	emits: ['click'],
	template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
});

const passthrough = { template: '<div><slot /></div>' };

function flow(): Flow {
	return {
		id: 'flow-1',
		name: 'Publish',
		icon: null,
		description: null,
		status: 'active',
		trigger: 'manual',
		options: { requireConfirmation: true },
		operation: null,
		accountability: 'all',
	};
}

describe('RunFlow', () => {
	it('submits a confirmation flow only once while the request is pending', async () => {
		let resolveRequest: (() => void) | undefined;

		mocks.apiPost.mockImplementation(() => new Promise<void>((resolve) => {
			resolveRequest = resolve;
		}));

		const wrapper = mount(RunFlow, {
			props: { flow: flow(), location: 'item' },
			global: {
				stubs: {
					'v-button': ButtonStub,
					'v-card': passthrough,
					'v-card-actions': passthrough,
					'v-card-text': passthrough,
					'v-card-title': passthrough,
					'v-dialog': passthrough,
					'v-form': passthrough,
				},
			},
		});
		const runButton = wrapper.findAll('button')[1];
		if (!runButton) throw new Error('Run button did not render');

		await runButton.trigger('click');
		await runButton.trigger('click');
		expect(mocks.apiPost).toHaveBeenCalledOnce();

		resolveRequest?.();
		await vi.waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
	});
});
