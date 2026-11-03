<script setup lang="ts">
import type { Step } from './types';
import { get } from 'lodash';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		modelValue: Step | null;
		data?: any;
		resultsPath?: string;
		textPath?: string;
		valuePath?: string;
		placeholder?: string;
		font?: 'sans-serif' | 'serif' | 'monospace';
		iconLeft?: string;
		iconRight?: string;
		disabled?: boolean;
		direction?: string;
	}>(),
	{
		font: 'sans-serif',
		textPath: 'text',
		valuePath: 'value',
	},
);

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const items = computed<any[]>(() => {
	if (!props.data) {
		return [];
	}

	try {
		const itemsArray = props.resultsPath ? get(props.data, props.resultsPath) : props.data;

		if (Array.isArray(itemsArray) === false) {
			console.warn(`Expected results type of array, "${typeof itemsArray}" received`);
			return [];
		}

		return itemsArray.map((item: Record<string, unknown>) => {
			if (props.textPath && props.valuePath) {
				return { text: get(item, props.textPath), value: get(item, props.valuePath) };
			}
			else if (props.textPath) {
				return { text: get(item, props.textPath), value: item };
			}
			else if (props.valuePath) {
				return { value: get(item, props.valuePath) };
			}
			else {
				return { value: item };
			}
		});
	}
	catch (error: any) {
		console.warn(error);
		return [];
	}
});

function clearValue() {
	emit('update:modelValue', null);
}

function emitValue(item: any) {
	emit('update:modelValue', item);
}
</script>

<template>
	<v-notice v-if="items.length === 0" type="warning">
		{{ t('one_or_more_options_are_missing') }}
	</v-notice>
	<div v-else>
		<v-menu
			attached
			full-height
			close-on-content-click
			:disabled="disabled"
		>
			<template #activator="{ toggle }">
				<v-input
					:placeholder="placeholder"
					:class="font"
					:disabled="disabled"
					:dir="direction"
					readonly
					clickable
					@click="toggle"
				>
					<template v-if="iconLeft" #prepend>
						<v-icon :name="iconLeft" />
					</template>

					<template v-if="modelValue" #input>
						<div class="content">
							{{ textPath ? modelValue.text : modelValue.value }}
						</div>
					</template>

					<template v-if="iconRight || modelValue" #append>
						<v-icon v-if="modelValue" v-tooltip.bottom="t('clear_value')" name="close" class="icon-clear" @click.stop="clearValue" />
						<v-icon v-if="iconRight" :name="iconRight" />
					</template>
				</v-input>
			</template>

			<v-list v-if="items.length > 0">
				<v-list-item v-for="(item, index) in items" :key="index" @click="() => emitValue(item)">
					<v-list-item-content>{{ textPath ? item.text : item.value }}</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-menu>
	</div>
</template>

<style lang="scss" scoped>
.v-input {
	&.monospace {
		--v-input-font-family: var(--theme--fonts--monospace--font-family);
	}

	&.serif {
		--v-input-font-family: var(--theme--fonts--serif--font-family);
	}

	&.sans-serif {
		--v-input-font-family: var(--theme--fonts--sans--font-family);
	}

	.content {
		flex-grow: 1;
	}

	.append .v-icon:not(:last-child) {
		margin-right: 8px;
	}

	.icon-clear {
		&:hover {
			color: var(--theme--danger);
		}
	}
}
</style>
