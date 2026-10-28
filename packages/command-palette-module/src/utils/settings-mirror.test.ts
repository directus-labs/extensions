import { describe, expect, it, vi } from 'vitest';
import { readPersistedSettings, syncSettingsMirror } from './settings-mirror';

const config = { searchMode: 'as_you_type', collections: [] };

// Core types collection as a string, but the copy stores null.
type PresetRow = Record<string, unknown>;

function mirror(value: unknown, overrides: PresetRow = {}): PresetRow {
	return {
		id: 7,
		collection: null,
		layout: 'command-palette',
		bookmark: null,
		user: null,
		role: null,
		layout_options: { 'command-palette': value },
		...overrides,
	};
}

function stores(options: {
	settings?: Record<string, unknown> | null;
	presets?: PresetRow[];
	server?: PresetRow[];
	admin?: boolean;
}) {
	const presetsStore = {
		collectionPresets: options.presets ?? [],
		create: vi.fn(async () => ({})),
		update: vi.fn(async () => ({})),
		delete: vi.fn(async () => {}),
	};

	const api = { get: vi.fn(async () => ({ data: { data: options.server ?? [] } })) };

	return {
		api,
		presetsStore,
		stores: {
			useSettingsStore: () => ({ settings: options.settings ?? null }),
			usePresetsStore: () => presetsStore,
			useUserStore: () => ({ currentUser: { id: 'user-1', admin_access: options.admin ?? false } }),
		},
	};
}

function sync({ stores: s, api }: ReturnType<typeof stores>) {
	return syncSettingsMirror(s, api as never);
}

describe('readPersistedSettings', () => {
	it('uses the settings field when it can be read', () => {
		const { stores: s } = stores({ settings: { command_palette_settings: config }, presets: [mirror({ stale: true })] });
		expect(readPersistedSettings(s)).toBe(config);
	});

	it('uses a readable but empty settings field instead of the copy', () => {
		const { stores: s } = stores({ settings: { command_palette_settings: null }, presets: [mirror(config)] });
		expect(readPersistedSettings(s)).toBeNull();
	});

	it('falls back to the global preset copy when the field is hidden', () => {
		const { stores: s } = stores({ settings: { project_name: 'Directus' }, presets: [mirror(config)] });
		expect(readPersistedSettings(s)).toEqual(config);
	});

	it('reads the oldest copy when there are several', () => {
		const { stores: s } = stores({ settings: {}, presets: [mirror({ newer: true }, { id: 777 }), mirror(config, { id: 100 })] });
		expect(readPersistedSettings(s)).toEqual(config);
	});

	it('ignores presets that are not the global copy', () => {
		const { stores: s } = stores({
			settings: {},
			presets: [
				mirror(config, { user: 'user-1' }),
				mirror(config, { role: 'role-1' }),
				mirror(config, { bookmark: 'Mine' }),
				mirror(config, { collection: 'articles' }),
			],
		});

		expect(readPersistedSettings(s)).toBeUndefined();
	});

	it('returns nothing when neither is available', () => {
		const { stores: s } = stores({ settings: null });
		expect(readPersistedSettings(s)).toBeUndefined();
	});
});

describe('syncSettingsMirror', () => {
	it('asks the server for the copies, oldest first', async () => {
		const context = stores({ admin: true, settings: { command_palette_settings: config } });
		await sync(context);

		const { params } = (context.api.get.mock.calls[0] as unknown as [string, { params: Record<string, unknown> }])[1];

		expect(JSON.parse(params.filter as string)).toEqual({
			collection: { _null: true },
			layout: { _eq: 'command-palette' },
			bookmark: { _null: true },
			user: { _null: true },
			role: { _null: true },
		});

		expect(params.sort).toBe('id');
	});

	it('creates the copy when the server has none', async () => {
		const context = stores({ admin: true, settings: { command_palette_settings: config } });
		await sync(context);

		expect(context.presetsStore.create).toHaveBeenCalledWith(mirror(config, { id: undefined }));
		expect(context.presetsStore.update).not.toHaveBeenCalled();
	});

	it('updates a stale copy', async () => {
		const context = stores({ admin: true, settings: { command_palette_settings: config }, server: [mirror({ old: true })] });
		await sync(context);

		expect(context.presetsStore.update).toHaveBeenCalledWith(7, { layout_options: { 'command-palette': config } });
		expect(context.presetsStore.create).not.toHaveBeenCalled();
	});

	it('does not write when the copy already matches', async () => {
		const context = stores({ admin: true, settings: { command_palette_settings: config }, server: [mirror(structuredClone(config))] });
		await sync(context);

		expect(context.presetsStore.create).not.toHaveBeenCalled();
		expect(context.presetsStore.update).not.toHaveBeenCalled();
		expect(context.presetsStore.delete).not.toHaveBeenCalled();
	});

	it('after two admins each created a copy, a save updates the oldest and removes the other', async () => {
		// This tab only knows the copy it created, which the server lists second.
		const context = stores({
			admin: true,
			settings: { command_palette_settings: config },
			presets: [mirror({ old: true }, { id: 777 })],
			server: [mirror({ old: true }, { id: 100 }), mirror({ old: true }, { id: 777 })],
		});

		await sync(context);

		expect(context.presetsStore.update).toHaveBeenCalledWith(100, { layout_options: { 'command-palette': config } });
		expect(context.presetsStore.delete).toHaveBeenCalledWith([777]);
		expect(context.presetsStore.create).not.toHaveBeenCalled();
	});

	it('removes extra copies even when the oldest already matches', async () => {
		const context = stores({ admin: true, settings: { command_palette_settings: config }, server: [mirror(config, { id: 100 }), mirror(config, { id: 777 })] });
		await sync(context);

		expect(context.presetsStore.update).not.toHaveBeenCalled();
		expect(context.presetsStore.delete).toHaveBeenCalledWith([777]);
	});

	it('does not write when there are no settings to copy', async () => {
		const context = stores({ admin: true, settings: {} });
		await sync(context);

		expect(context.api.get).not.toHaveBeenCalled();
		expect(context.presetsStore.create).not.toHaveBeenCalled();
	});

	it('never writes for non-admins', async () => {
		const context = stores({ settings: { command_palette_settings: config }, server: [mirror({ old: true })] });
		await sync(context);

		expect(context.api.get).not.toHaveBeenCalled();
		expect(context.presetsStore.create).not.toHaveBeenCalled();
		expect(context.presetsStore.update).not.toHaveBeenCalled();
	});

	it('does not let a slow startup sync overwrite a newer save', async () => {
		const settings = { command_palette_settings: { version: 'startup' } as unknown };
		const server: Record<string, unknown>[] = [];
		let releaseStartup!: () => void;
		const startupLookup = new Promise<void>((resolve) => (releaseStartup = resolve));

		const presetsStore = {
			collectionPresets: [],
			create: vi.fn(async (preset: Record<string, unknown>) => server.push({ ...preset, id: 100 })),
			update: vi.fn(async (id: number, updates: Record<string, unknown>) => Object.assign(server.find((row) => row.id === id)!, updates)),
			delete: vi.fn(),
		};

		const api = {
			get: vi.fn()
				.mockImplementationOnce(async () => {
					await startupLookup;
					return { data: { data: structuredClone(server) } };
				})
				.mockImplementation(async () => ({ data: { data: structuredClone(server) } })),
		};

		const s = {
			useSettingsStore: () => ({ settings }),
			usePresetsStore: () => presetsStore,
			useUserStore: () => ({ currentUser: { id: 'user-1', admin_access: true } }),
		};

		const startup = syncSettingsMirror(s, api as never);
		settings.command_palette_settings = { version: 'saved' };
		const save = syncSettingsMirror(s, api as never);

		releaseStartup();
		await Promise.all([startup, save]);

		expect(server).toHaveLength(1);
		expect(server[0]!.layout_options).toEqual({ 'command-palette': { version: 'saved' } });
	});

	it('lets the caller handle a failed write', async () => {
		const context = stores({ admin: true, settings: { command_palette_settings: config } });
		context.presetsStore.create.mockRejectedValueOnce(new Error('Forbidden'));

		await expect(sync(context)).rejects.toThrow('Forbidden');
	});
});
