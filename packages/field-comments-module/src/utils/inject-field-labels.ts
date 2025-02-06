import type { Field } from '@directus/types';
import type { App } from 'vue';
import type { CommentCollectionType, Packet } from '../types';
import { API_INJECT, STORES_INJECT } from '@directus/constants';
import { computed, createApp, inject, nextTick } from 'vue';
import { routerKey } from 'vue-router';
import FieldLabel from '../components/field-label.vue';
import { OPEN_COMMENTS } from '../constants';
import { comments_schema, schema_directus_comments_field } from '../schema';
import { system_field } from '../settings-field';
import { getDirectusApp, getDirectusAppProvides } from './get-directus-app';
import { getDirectusRouter } from './get-directus-router';
import { unexpectedError } from './unexpected-error';

const config = { attributes: false, childList: true, subtree: true };
let app: App | null = null;

export function injectFieldLabels(options: Record<string, boolean> = { update: false }) {
	const router = getDirectusRouter();

	if (router) {
		if (options.update && router.currentRoute.value.name == 'content-item' && router.currentRoute.value.params.primaryKey != '+') {
			injectApp(router.currentRoute.value);
		}
		else {
			router.afterEach(async (to: Record<string, any>) => {
				// Remove DOM listner if active
				if (observer)
					observer.disconnect();

				if (to.name == 'settings-project') {
					initializeApp();
				}
				else if (to.name == 'content-item' && to.params.primaryKey != '+') {
					await nextTick();
					injectApp(to);
				}
			});
		}
	}
}

const observer = new MutationObserver((mutations, observer) => {
	if (mutations.filter((e) => (e.target as HTMLElement).classList[0] == 'field-name' || (e.target as HTMLElement).classList[0] == 'v-detail' || (e.target as HTMLElement).classList[0] == 'accordion-section').length > 0) {
		observer.disconnect();
		injectFieldLabels({ update: true });
	}
});

async function initializeApp(retry: number = 0) {
	const titleContainer = document.querySelector('.title-container');

	if (!titleContainer) {
		if (retry < 3) {
			setTimeout(() => initializeApp(retry + 1), 100);
		}

		return;
	}

	const directusApp = getDirectusApp();
	const stores = directusApp._container._vnode.component.provides[STORES_INJECT];

	const { useFieldsStore, useSettingsStore, useUserStore } = stores;
	const fieldStore = useFieldsStore();
	const settingsStore = useSettingsStore();
	const userStore = useUserStore();

	const isAdmin = computed(() => userStore.currentUser?.role?.admin_access ?? userStore.currentUser?.admin_access ?? false);

	if (isAdmin) {
		try {
			// Create required fields
			await fieldStore.upsertField(comments_schema.table, 'field', schema_directus_comments_field);
			await fieldStore.upsertField('directus_settings', 'field_comments_settings', system_field);
			await settingsStore.hydrate();
		}
		catch (error: any) {
			unexpectedError(error, stores);
		}
	}
}

async function injectApp(to: Record<string, any>, retry: number = 0) {
	const collection = to.params.collection;
	const primaryKey = to.params.primaryKey;

	// Exit if creating a new item
	if (primaryKey == '+')
		return;

	// Use title as anchor
	const titleContainer = document.querySelector('.title-container');

	// Wait until app loaded
	if (!titleContainer) {
		if (retry < 3) {
			setTimeout(() => injectApp(to, retry + 1), 100);
		}

		return;
	}

	// Remove existing injected items
	if (app) {
		app.unmount();
	}

	const directusApp = getDirectusApp();

	// Get Stores and API
	const stores = directusApp._container._vnode.component.provides[STORES_INJECT];
	const useApi = directusApp._container._vnode.component.provides[API_INJECT];

	const { useFieldsStore, useSettingsStore, usePermissionsStore } = stores;
	const fieldStore = useFieldsStore();
	const settingsStore = useSettingsStore();
	const permissionStore = usePermissionsStore();
	const { hasPermission } = permissionStore;
	const api = useApi;

	// Fetch Settings
	const fieldCommentSettings = computed(
		() => (typeof settingsStore.settings.field_comments_settings == 'string' ? JSON.parse(settingsStore.settings.field_comments_settings) : settingsStore.settings.field_comments_settings).filter((i: CommentCollectionType) => i.collection == collection),
	);

	// Exit if no settings found
	if (fieldCommentSettings.value.length === 0)
		return;

	// Fetch all fields for the current collection
	const fields = fieldStore.getFieldsForCollection(collection);

	try {
		// Fetch comment count for all fields
		const response = hasPermission(comments_schema.table, 'read')
			? (
					await api.get(`/${comments_schema.endpoint}`, {
						params: {
							__field_comments__: true,
							filter: {
								_and: [
									{
										field: {
											_in: fields.map((f: Field) => {
												return f.meta?.id;
											}),
										},
									},
									{
										comment: {
											_nnull: true,
										},
									},
									{
										item: {
											_eq: primaryKey,
										},
									},
								],
							},
							aggregate: {
								count: 'id',
							},
							groupBy: ['field'],
						},
					})
				)?.data?.data
			: [];

		// Iterate over all visible fields
		const fieldLabels = document.querySelectorAll('.field-name') ?? [];

		fieldLabels.forEach((f: any) => {
			const label = f.querySelector('div') ? f.querySelector('div')?.innerHTML : f.innerHTML;
			const matches: Array<Record<string, any>> = fields.filter((i: Field) => i.name == label && (fieldCommentSettings.value[0].all_fields || fieldCommentSettings.value[0].fields.includes(i.field)));
			const isEnabled: boolean = matches.length > 0;

			if (isEnabled) {
				const ID = `field-comments-${matches[0]?.meta.id}`;
				const fieldLabelExtension = document.getElementById(ID) ?? document.createElement('span');

				// If element doesn't already exist
				if (!document.getElementById(ID)) {
					fieldLabelExtension.id = ID;
					// fieldLabelExtension.classList.add("v-badge");

					const packet: Packet = {
						collection_name: collection,
						field_id: matches[0]?.meta.id,
						item_id: primaryKey,
					};

					if (f.querySelector('.ctx-arrow')) {
						f.insertBefore(fieldLabelExtension, f.querySelector('.ctx-arrow'));

						f.addEventListener('click', () => {
							injectCommentsMenuItem(packet);
						});
					}
					else {
						f.appendChild(fieldLabelExtension);
					}

					fieldLabelExtension.addEventListener('click', (e) => {
						e.stopPropagation(); // Prevent existing click events
						// Open Comments Drawer
						window.dispatchEvent(new CustomEvent(OPEN_COMMENTS, { detail: packet }));
					});

					const injects = getDirectusAppProvides(directusApp);

					app = createApp(FieldLabel, { count: response.filter((i: Record<string, number | Record<string, string>>) => i.field == matches[0]?.meta.id)[0]?.count?.id ?? 0 });
					app.provide(STORES_INJECT, injects[STORES_INJECT]);

					directusApp.runWithContext(() => {
						app!.provide(routerKey, inject(routerKey)!);
					});

					// Add element to app
					app.mount(fieldLabelExtension);
				}
			}
		});

		// Watch for dynamic fields in the DOM
		const mainContent = document.getElementById('main-content');
		observer.observe(mainContent as HTMLElement, config);
	}
	catch (err: any) {
		unexpectedError(err, stores);
	}
}

// Add option to label's contextual menu
function injectCommentsMenuItem(packet: Packet) {
	const v_menu = document.querySelector('.v-menu-popper.active');
	const v_list = v_menu?.querySelector('.v-list');
	const v_divider = v_list?.querySelector('.v-divider')?.cloneNode(true);
	const v_list_item = v_list?.querySelector('.v-list-item')?.cloneNode(true);
	const v_list_item_icon = (v_list_item as HTMLElement)?.querySelector('i');
	v_list_item_icon?.setAttribute('data-icon', 'chat_bubble_outline');
	const v_list_item_contet = (v_list_item as HTMLElement)?.querySelector('.v-list-item-content');

	if (v_list_item_contet) {
		v_list_item_contet.textContent = 'View Comments';
	}

	if (v_divider) {
		v_list?.appendChild(v_divider);
	}

	if (v_list_item) {
		v_list?.appendChild(v_list_item);

		v_list_item.addEventListener('click', () => {
			window.dispatchEvent(new CustomEvent(OPEN_COMMENTS, { detail: packet }));
		});
	}
}
