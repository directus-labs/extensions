// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import Settings from './settings.vue';
import { defaultSettings } from './types';

const saved = { searchMode: 'as_you_type' as const, collections: [], triggerRate: 300 };
const settingsStore = reactive({ settings: { command_palette_settings: defaultSettings } as Record<string, unknown>, hydrate: vi.fn() });
const user = { id: 'admin', admin_access: true };
let settingsField: object | null = { field: 'command_palette_settings' };
const VForm = defineComponent({ name: 'VForm', emits: ['update:modelValue'], setup: () => () => h('form') });
let serverCopies: object[] = [];
const api = { patch: vi.fn(async () => ({})), get: vi.fn(async () => ({ data: { data: serverCopies } })) };
const presetsStore = { collectionPresets: [], create: vi.fn(async () => ({})), update: vi.fn(async () => ({})), delete: vi.fn() };
const notify = vi.fn();

vi.mock('@directus/extensions-sdk', () => ({
	useApi: () => api,
	useStores: () => ({
		useSettingsStore: () => settingsStore,
		useFieldsStore: () => ({ getField: () => settingsField }),
		useNotificationsStore: () => ({ add: notify }),
		usePresetsStore: () => presetsStore,
		useUserStore: () => ({ currentUser: user }),
	}),
}));

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), onBeforeRouteLeave: vi.fn() }));

function mountSettings() {
	return mount(Settings, {
		global: {
			stubs: {
				'private-view': defineComponent((_, { slots }) => () => h('div', [slots.actions?.(), slots.default?.()])),
				'v-form': VForm,
				'v-button': defineComponent({ emits: ['click'], setup: (_, { emit, slots }) => () => h('button', { onClick: () => emit('click') }, slots.default?.()) }),
				'v-icon': true,
				'v-info': defineComponent({ props: ['title'], setup: (props, { slots }) => () => h('div', [props.title, slots.default?.()]) }),
				'v-dialog': true,
				'v-card': true,
				'v-card-title': true,
				'v-card-actions': true,
				'v-card-text': true,
				'sidebar-detail': true,
				'SearchNavigation': true,
			},
			directives: { tooltip: {}, md: {} },
		},
	});
}

async function save() {
	const wrapper = mountSettings();

	wrapper.findComponent(VForm).vm.$emit('update:modelValue', { triggerRate: 300 });
	await flushPromises();
	await wrapper.get('button').trigger('click');
	await flushPromises();

	return wrapper;
}

beforeEach(() => {
	vi.clearAllMocks();
	serverCopies = [];
	user.admin_access = true;
	settingsField = { field: 'command_palette_settings' };
	settingsStore.settings = { command_palette_settings: defaultSettings };

	settingsStore.hydrate.mockImplementation(async () => {
		settingsStore.settings = { command_palette_settings: { ...defaultSettings, ...saved } };
	});
});

describe('Settings', () => {
	it('saves the settings field and then the global preset copy', async () => {
		await save();

		expect(api.patch).toHaveBeenCalledWith('/settings', { command_palette_settings: expect.objectContaining({ triggerRate: 300 }) });

		expect(presetsStore.create).toHaveBeenCalledWith(expect.objectContaining({
			collection: null,
			layout: 'command-palette',
			user: null,
			role: null,
			bookmark: null,
			layout_options: { 'command-palette': settingsStore.settings.command_palette_settings },
		}));

		expect(api.patch.mock.invocationCallOrder[0]).toBeLessThan(presetsStore.create.mock.invocationCallOrder[0]!);
		expect(notify).toHaveBeenCalledWith({ title: 'settings_update_success' });
	});

	it.each(['create', 'update'] as const)('warns instead of reporting success when the copy %s fails', async (action) => {
		if (action === 'update') serverCopies = [{ id: 7, layout_options: { 'command-palette': defaultSettings } }];
		presetsStore[action].mockRejectedValueOnce(new Error('Forbidden'));
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		const wrapper = await save();

		expect(api.patch).toHaveBeenCalledOnce();
		expect(presetsStore[action]).toHaveBeenCalledOnce();
		expect(notify).toHaveBeenCalledOnce();
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
		expect(notify.mock.calls[0]![0].title).toContain('non-admin users');

		// The field is saved, so the edits are not left pending.
		expect(wrapper.get('button').attributes('disabled')).toBeDefined();
	});

	it('shows non-admins the not-allowed state even when they cannot read the settings field', async () => {
		user.admin_access = false;
		settingsStore.settings = {};
		settingsField = null;

		const wrapper = mountSettings();
		await flushPromises();

		expect(wrapper.text()).toContain('Unauthorized Access');
		expect(wrapper.text()).not.toContain('Settings Field Missing');
		expect(wrapper.find('button').exists()).toBe(false);
	});
});
