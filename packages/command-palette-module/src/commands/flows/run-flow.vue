<script setup lang="ts">
import type { Flow } from '@directus/types';
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useCommandContext } from '../../command-palette';
import { useCommandRouter } from '../../command-palette/router/router';
import { useUnexpectedError } from '../../composables/use-unexpected-error';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import {
	getManualFlowConfirmDetails,
	isManualFlowConfirmButtonDisabled,
	triggerManualFlow,
} from './manual-flow';

const props = defineProps<{
	flow: Flow;
	location: 'item' | 'collection';
}>();

const stores = useStores();
const { useNotificationsStore } = stores;
const { t } = useI18n();
const unexpectedError = useUnexpectedError();
const notificationsStore = useNotificationsStore();
const api = useApi();
const route = useRoute();
const { close } = useCommandContext();
const { pop: goBack } = useCommandRouter();
const confirmValues = ref<Record<string, any> | null>(null);
const running = ref(false);
const collection = computed(() => typeof route.params.collection === 'string' ? route.params.collection : '');
const primaryKey = computed(() => getRoutePrimaryKey(route.params.primaryKey) ?? null);
const confirmDetails = computed(() => getManualFlowConfirmDetails(props.flow));
const isConfirmButtonDisabled = computed(() =>
	isManualFlowConfirmButtonDisabled(props.flow.id, confirmDetails.value, confirmValues.value),
);
const confirmButtonCTA = computed(() =>
	props.location === 'item' ? t('run_flow_on_current') : t('run_flow'),
);

async function runFlow() {
	if (running.value) return;
	running.value = true;

	try {
		const options = {
			api,
			flow: props.flow,
			collection: collection.value,
			values: confirmValues.value,
		};

		await (props.location === 'item'
			? triggerManualFlow({ ...options, location: props.location, primaryKey })
			: triggerManualFlow({ ...options, location: props.location }));

		notificationsStore.add({ title: t('run_flow_success', { flow: props.flow.name }) });
		await notificationsStore.refreshUnreadCount?.();
		close();
	}
	catch (error) {
		unexpectedError(error);
	}
	finally {
		running.value = false;
	}
}
</script>

<template>
	<v-dialog :model-value="!!confirmDetails" @esc="goBack">
		<v-card class="allow-drawer">
			<v-card-title>{{ confirmDetails?.description ?? t('run_flow_confirm') }}</v-card-title>
			<v-card-text class="confirm-form">
				<v-form
					v-if="confirmDetails?.fields.length"
					:fields="confirmDetails.fields"
					:model-value="confirmValues"
					autofocus
					primary-key="+"
					@update:model-value="confirmValues = $event"
				/>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="goBack">
					{{ t('cancel') }}
				</v-button>
				<v-button
					:loading="running"
					:disabled="running || isConfirmButtonDisabled"
					@click="runFlow"
				>
					{{ confirmButtonCTA }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
