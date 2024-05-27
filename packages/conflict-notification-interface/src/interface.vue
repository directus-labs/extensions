<template>
	<v-notice v-if="merged.length > 0">{{ 'Successfully merged updates in: ' + merged.join(', ') }}</v-notice>
	<v-dialog v-if="conflicts.length > 0" v-model="resolveConflict" @esc="resolveConflict = false">
		<v-card>
			<v-card-title>{{ 'Someone updated this item with conflicts!' }}</v-card-title>
			<v-card-text v-for="(key, cur, next) in conflicts">
				<v-input prefix="Current: " disabled="true" :value="cur"></v-input>
				<v-input prefix="Incoming: " disabled="true" :value="next"></v-input>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="resolveConflict = false">
					{{ 'Ignore Updates' }}
				</v-button>
				<v-button kind="danger" @click="() => window.location.reload()">
					{{ 'Reload Item' }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref, unref } from 'vue';
import { useWebSocket } from './websocket';
import { useFormData } from './form-data';

const emit = defineEmits(['setFieldValue']);
const { collection, id, values, initialValues, fieldChanged, updateField } = useFormData();
const resolveConflict = ref(false);
const conflicts = ref([]);
const merged = ref([]);
const uid = '123';

useWebSocket({
	onOpen(ws) {
		console.log('open')
		ws.send(JSON.stringify({
			type: 'subscribe', uid,
			collection: unref(collection),
			item: unref(id),
		}));
	},
	onClose(ws) {
		console.log('close')
		ws.send(JSON.stringify({
			type: 'unsubscribe', uid
		}));
		// probably needs some reconnecting
	},
	onMessage(msg) {
		console.log('msg', msg)
		if (msg.type === 'subscription' && msg.uid === uid) {
			if (msg.event === 'delete') {
				alert('Someone deleted the item you are working on!!!');
			}
			if (msg.event === 'update') {
				const vals = unref(initialValues);
				const keys = Object.keys(vals);

				for (const key of keys) {
					if (msg.data[key] != vals[key]) {
						if (fieldChanged(key)) {
							conflicts.value.push({ key, cur: values.value[key], next: msg.data[key] })
							resolveConflict.value = true;
							console.log('test', conflicts.value)
						} else {
							setFieldValue(key, msg.data[key]);
							if (!merged.value.includes(key)) {
								merged.value.push(key);
								setTimeout(() => {
									if (merged.value.includes(key)) {
										const index = merged.value.indexOf(key);
										if (index !== -1) merged.value.splice(index, 1);
									}
								}, 60_000);
							}
						}
					}
				}
			}
		}
	},
});

function setFieldValue(field, value) {
	setTimeout(() => emit('setFieldValue', { field, value }), 1);
	updateField(field, value);
}
</script>
