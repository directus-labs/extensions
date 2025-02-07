<script lang="ts" setup>
import { inject, toRefs } from 'vue';
import { useCalculatedFormula } from '../composables/use-calculated-formula';
import './style.scss';

defineOptions({
	inheritAttrs: false,
});

const props = defineProps<{
	primaryKey: string;
	collection: string;
	formula: string;
	iconLeft?: string;
	iconRight?: string;
}>();

const { formula, collection, primaryKey } = toRefs(props);

const values = inject<Record<string, any>>('values');

const { result, parseError, fetchError, evalError } = useCalculatedFormula({
	formula,
	collection,
	primaryKey,
	injectedValues: values!,
});
</script>

<template>
	<v-notice v-if="!props.formula" type="warning">
		No formula provided.
	</v-notice>
	<v-notice v-else-if="parseError" type="danger">
		<div>
			<p>Failed to parse formula</p>
			<code v-if="typeof parseError === 'string'">
				<pre>{{ parseError }}</pre>
			</code>
			<p v-else>
				{{ parseError }}
			</p>
		</div>
	</v-notice>
	<v-notice v-else-if="fetchError" type="danger">
		{{ fetchError }}
	</v-notice>
	<v-notice v-else-if="evalError" type="danger">
		{{ evalError }}
	</v-notice>
	<v-input v-else :model-value="result" readonly>
		<template v-if="iconLeft" #prepend>
			<v-icon :name="iconLeft" />
		</template>
		<template v-if="iconRight" #append>
			<v-icon :name="iconRight" />
		</template>
	</v-input>
</template>

<style scoped>
.v-notice {
	overflow-y: auto;
}

pre {
	font-family: var(--theme--fonts--monospace--font-family);
}
</style>
