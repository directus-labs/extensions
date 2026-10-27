<script setup lang="ts">
import type { SeoInterfaceOptions, SeoValue } from '../shared/types/seo';
import { computed } from 'vue';
import { useSeoI18n } from '../lang/use-seo-i18n';
import { getSeoStatus, worstSeoStatus } from '../shared/seo-status';

const props = defineProps<{
	values: SeoValue[];
	interfaceOptions: SeoInterfaceOptions;
}>();

const { t } = useSeoI18n();

const statuses = computed(() => props.values.map((value) => getSeoStatus(value, props.interfaceOptions)));
const worst = computed(() => worstSeoStatus(statuses.value));
</script>

<template>
	<v-menu trigger="hover" :delay="300" show-arrow>
		<template #activator>
			<v-chip outlined>
				<v-icon :name="worst.icon" :class="worst.color" />
			</v-chip>
		</template>
		<div class="preview-box">
			<label class="header-label field-label type-label">{{ t('seo_plugin.ui.seo_status') }}</label>
			<div v-for="(status, index) in statuses" :key="index" class="preview-box-item border-bottom-dash">
				<span>{{ t('seo_plugin.ui.translation_number', { number: index + 1 }) }}</span>
				<v-icon :name="status.icon" :class="status.color" small />
			</div>
			<small class="hint">{{ t('seo_plugin.ui.translations_display_hint') }}</small>
		</div>
	</v-menu>
</template>

<style lang="scss" scoped>
@use '../shared/styles/status.scss' as *;

.hint {
	color: var(--theme--foreground-subdued);
}
</style>
