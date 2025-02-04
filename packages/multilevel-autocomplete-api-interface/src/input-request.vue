<script setup lang="ts">
import type { Scope, Step } from './types';
import { debounce, get, throttle } from 'lodash';
import { render } from 'micromustache';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		modelValue: Step | null;
		scope: Scope;
		method?: string;
		url?: string;
		headers?: any;
		body?: any;
		trigger?: 'debounce' | 'throttle';
		rate?: number | string;
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
		trigger: 'throttle',
		rate: 500,
		font: 'sans-serif',
	},
);

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const results = ref<Record<string, any>[]>([]);

async function fetchResultsRaw(inputValue: string) {
	if (!props.url) {
		return;
	}

	const url = render(props.url, {
		value: inputValue,
		...props.scope,
	});

	try {
		let reqOpt: any = { method: (props.method ? props.method : 'GET') };

		if (props.headers) {
			const fetchHeaders = new Headers();

			for (const headerItem of props.headers) {
				fetchHeaders.append(headerItem.header, headerItem.value);
			}

			reqOpt = { ...reqOpt, headers: fetchHeaders };
		}

		if (reqOpt.method !== 'GET' && props.body) {
			reqOpt = { ...reqOpt, body: (typeof (props.body) === 'string' ? props.body : JSON.stringify(props.body)) };
		}

		const data = await fetch(url, reqOpt).then((res) => res.json());
		const resultsArray = props.resultsPath ? get(data, props.resultsPath) : data;

		if (Array.isArray(resultsArray) === false) {
			console.warn(`Expected results type of array, "${typeof resultsArray}" received`);
			return;
		}

		results.value = resultsArray.map((result: Record<string, unknown>) => {
			if (props.textPath && props.valuePath) {
				return { text: get(result, props.textPath), value: get(result, props.valuePath) };
			}
			else if (props.textPath) {
				return { text: get(result, props.textPath), value: result };
			}
			else if (props.valuePath) {
				return { value: get(result, props.valuePath) };
			}
			else {
				return { value: result };
			}
		});
	}
	catch (err: any) {
		console.warn(err);
	}
}

const fetchResults
	= props.trigger === 'debounce'
		? debounce(fetchResultsRaw, Number(props.rate))
		: throttle(fetchResultsRaw, Number(props.rate));

const inputValue = ref('');

function onInput(value: string) {
	inputValue.value = value;
	fetchResults(value);
}

function onFocus(activator: () => void) {
	activator();
	fetchResults(inputValue.value);
}

function onClick(activator: () => void) {
	activator();
	fetchResults(inputValue.value);
}

function clearValue() {
	inputValue.value = '';
	emit('update:modelValue', null);
}

function emitValue(item: any) {
	emit('update:modelValue', item);
}
</script>

<template>
	<v-notice v-if="!url" type="warning">
		{{ t('one_or_more_options_are_missing') }}
	</v-notice>
	<div v-else>
		<v-menu attached :disabled="disabled">
			<template #activator="{ activate, toggle }">
				<v-input
					:model-value="inputValue"
					:placeholder="placeholder"
					:class="font"
					:disabled="disabled"
					:dir="direction"
					:clickable="modelValue"
					@update:model-value="onInput"
					@focus="() => onFocus(activate)"
					@click="() => modelValue && onClick(toggle)"
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

			<v-list v-if="results.length > 0">
				<v-list-item v-for="result of results" :key="result.value" @click="() => emitValue(result)">
					<v-list-item-content>{{ textPath ? result.text : result.value }}</v-list-item-content>
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
