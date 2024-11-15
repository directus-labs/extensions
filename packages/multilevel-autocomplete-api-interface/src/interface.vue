<script setup lang="ts">
import { formatTitle } from '@directus/format-title';
import { parseJSON, optionToObject } from '@directus/utils';
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { render } from 'micromustache';
import InputRequest from './input-request.vue';
import InputData from './input-data.vue';
import { Source, Step, Value, Scope } from './types';

type StepProps = {
	source: Source;
	requestMethod?: string;
	requestUrl?: string;
	requestHeaders?: { header: string; value: string }[];
	requestBody?: Record<string, any> | string;
	requestTrigger?: 'debounce' | 'throttle';
	requestRate?: number | string;
	list?: { text: string; value: string }[];
	resultsPath?: string;
	textPath?: string;
	valuePath?: string;
	placeholder?: string;
	font?: 'sans-serif' | 'serif' | 'monospace';
	iconLeft?: string;
	iconRight?: string;
};

type Props = StepProps & {
	field: string;
	value: Value | null;
	nestedSteps: StepProps[];
	payload?: Record<string, any> | string | null;
	disabled?: boolean;
	direction?: string;
};

const props = withDefaults(defineProps<Props>(), {
	source: Source.request,
	requestMethod: 'GET',
	requestTrigger: 'throttle',
	font: 'sans-serif',
	resultsPath: '',
});

const emit = defineEmits<{
	(event: 'input', value: Value): void;
}>();

const { t } = useI18n();

const showDialog = ref(false);

const steps: StepProps[] = [
	props,
	...props.nestedSteps,
];

function getInitialValue(value: Value | null): Value {
	return {
		steps: value?.steps ?? steps.map(() => null),
		payload: value?.payload ?? {},
	};
}

function getScope(value: Value | null): Scope {
	if (!value) {
		return {};
	}
	if (!value.steps) {
		return {};
	}
	const steps = value.steps;
	return {
		steps,
		values: steps.map((step) => step?.value ?? null),
	};
}

const value = reactive<Value>(getInitialValue(props.value));

const scope = ref<Scope>(getScope(props.value));

const breadcrumbs = computed<Step[]>(() => {
	return value.steps.filter((step) => Boolean(step)) as Step[];
});

const hasBreadcrumbs = computed<boolean>(() => {
	return breadcrumbs.value.length > 0;
});

function isStepDisabled(index: number): boolean {
	if (index === 0) {
		return false;
	} else {
		return value.steps[index - 1] === null;
	}
}

function clearStepsAfterIndex(index: number): void {
	for (let i = index + 1; i < value.steps.length; i++) {
		value.steps[i] = null;
	}
}

watch(
	() => props.value,
	(newValue) => {
		Object.assign(value, getInitialValue(newValue));
	},
	{ deep: true },
);

watch(
	() => value.steps,
	() => {
		const nullIndex = value.steps.findIndex((step) => step === null);
		if (nullIndex > -1) {
			for (let index = nullIndex + 1; index < value.steps.length; index++) {
				value.steps[index] = null;
			}
		}
		scope.value = getScope(value);
		try {
			const template = optionToObject(props.payload);
			if (template) {
				const payload = render(JSON.stringify(template), scope.value);
				value.payload = parseJSON(payload);
			}
		} catch (err: any) {
			console.warn(err);
		}
	},
	{ deep: true },
);

watch(
	() => value,
	() => {
		emit('input', value);
	},
	{ deep: true },
);

</script>

<template>
	<v-dialog v-model="showDialog" @esc="showDialog = false">
		<template #activator="{ on }">
			<v-input
				:placeholder="props.placeholder"
				:disabled="props.disabled"
				@click="on"
			>
				<template v-if="iconLeft && !hasBreadcrumbs" #prepend>
					<v-icon :name="iconLeft" />
				</template>

				<template v-if="hasBreadcrumbs" #input>
					<div class="breadcrumb">
						<div class="section" v-for="(step, index) in breadcrumbs" :key="index">
							<v-icon v-if="index > 0" name="chevron_right" small class="separator" />
							<v-icon v-if="steps[index]?.iconLeft" :name="steps[index].iconLeft" class="prepend" />
							<div>{{ step.text ?? step.value }}</div>
						</div>
					</div>
				</template>
			</v-input>
		</template>

		<v-card>
			<v-card-title>{{ formatTitle(field) }}</v-card-title>
			<v-card-text>
				<div v-for="(step, index) in steps" :key="index" class="step">
					<div v-if="steps[index].source === Source.request">
						<InputRequest
							v-model="value.steps[index]"
							:scope="scope"
							:method="step.requestMethod"
							:url="step.requestUrl"
							:headers="step.requestHeaders"
							:body="step.requestBody"
							:trigger="step.requestTrigger"
							:rate="step.requestRate"
							:resultsPath="step.resultsPath"
							:textPath="step.textPath"
							:valuePath="step.valuePath"
							:placeholder="step.placeholder"
							:font="step.font"
							:iconLeft="step.iconLeft"
							:iconRight="step.iconRight"
							:direction="props.direction"
							:disabled="isStepDisabled(index)"
							@update:modelValue="() => clearStepsAfterIndex(index)"
						></InputRequest>
					</div>
					<div v-if="steps[index].source === Source.list">
						<InputData
							v-model="value.steps[index]"
							:data="step.list"
							:resultsPath="step.resultsPath"
							:textPath="step.textPath"
							:valuePath="step.valuePath"
							:placeholder="step.placeholder"
							:font="step.font"
							:iconLeft="step.iconLeft"
							:iconRight="step.iconRight"
							:direction="props.direction"
							:disabled="isStepDisabled(index)"
							@update:modelValue="() => clearStepsAfterIndex(index)"
						></InputData>
					</div>
				</div>
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="showDialog = false">
					{{ t('done') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<style lang="scss" scoped>
.v-input {
	cursor: pointer;

	& :deep(input) {
		cursor: pointer;
	}

	&.monospace {
		--v-input-font-family: var(--theme--fonts--monospace--font-family);
	}

	&.serif {
		--v-input-font-family: var(--theme--fonts--serif--font-family);
	}

	&.sans-serif {
		--v-input-font-family: var(--theme--fonts--sans--font-family);
	}

	.breadcrumb {
		display: flex;
		align-items: center;

		.section {
			display: flex;
			align-items: center;
			color: var(--theme--foreground-text-color);

			.v-icon {
				&.separator {
					margin: 0 4px;
				}

				&.prepend {
					margin-right: 8px;
				}

				&.append {
					margin-left: 8px;
				}
			}
		}
	}
}

.v-card-text {
	.step:not(:last-child) {
		margin-bottom: 8px;
	}
}
</style>
