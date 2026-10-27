<script setup lang="ts">
import { getRootPath } from '@directus-labs/utils';
import { computed, ref } from 'vue';
import { useSeoI18n } from '../../lang/use-seo-i18n';
import { nextRovingValue, truncate } from '../utils';

const props = defineProps<{
	title: string;
	description: string;
	ogImage?: string | null;
}>();

const { t } = useSeoI18n();

type Platform = 'facebook' | 'linkedin' | 'x';
const selectedPlatform = ref<Platform>('linkedin');

const platforms: { value: Platform; label: string; icon: string }[] = [
	{ value: 'facebook', label: 'Facebook', icon: 'facebook' },
	{ value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
	{ value: 'x', label: 'X', icon: 'x_twitter' },
];

function onPlatformKeydown(event: KeyboardEvent) {
	const next = nextRovingValue(event.key, platforms.map((platform) => platform.value), selectedPlatform.value);
	if (!next) return;

	event.preventDefault();
	selectedPlatform.value = next;
	(event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-platform="${next}"]`)?.focus();
}

const imageUrlToDisplay = computed(() => {
	if (!props.ogImage) return null;

	const url = `${getRootPath()}assets/${props.ogImage}?width=1200&height=630`;

	return url;
});

const domain = computed(() => {
	if (typeof window !== 'undefined') {
		// Get the hostname from the window location
		return new URL(window.location.href).hostname;
	}

	return '';
});
</script>

<template>
	<div class="seo-image-preview">
		<div class="preview-header">
			<label class="label field-label type-label">{{ t('seo_plugin.preview.social_media_preview') }}</label>
		</div>
		<div class="preview-container">
			<div class="og-preview-container">
				<div class="og-preview" :class="`og-preview--${selectedPlatform}`">
					<div class="preview-image-container">
						<!-- Default slot for image upload  -->
						<slot>
							<img
								:src="imageUrlToDisplay"
								class="preview-image"
								alt="OG Image Preview"
							>
						</slot>
						<div v-if="selectedPlatform === 'x'" class="preview-domain-badge">
							{{ domain }}
						</div>
					</div>
					<div v-if="!props.ogImage" class="preview-content empty-content">
						<div class="empty-state-message">
							<p>
								{{ t('seo_plugin.ui.upload_image_preview') }}
							</p>
						</div>
					</div>
					<div v-else class="preview-content">
						<div class="preview-domain">
							{{ domain }}
						</div>
						<div class="preview-title">
							{{ truncate(title, 60) || t('seo_plugin.ui.preview_title') }}
						</div>
						<div class="preview-description">
							{{ truncate(description, 160) || t('seo_plugin.ui.preview_description') }}
						</div>
					</div>
				</div>
			</div>
			<div class="preview-info">
				<h3>{{ t('seo_plugin.ui.social_preview_desc') }}</h3>
				<div class="platform-selection">
					<div class="platform-switcher" role="radiogroup" :aria-label="t('seo_plugin.ui.platforms_label')" @keydown="onPlatformKeydown">
						<button
							v-for="platform in platforms"
							:key="platform.value"
							type="button"
							role="radio"
							class="platform-tab"
							:data-platform="platform.value"
							:tabindex="selectedPlatform === platform.value ? 0 : -1"
							:aria-checked="selectedPlatform === platform.value"
							:data-state="selectedPlatform === platform.value ? 'checked' : 'unchecked'"
							@click="selectedPlatform = platform.value"
						>
							<v-icon :name="platform.icon" small />
							<span>{{ platform.label }}</span>
							<div v-if="selectedPlatform === platform.value" class="platform-indicator">
								<div class="indicator-bar" />
							</div>
						</button>
					</div>
				</div>
				<div class="recommendations">
					<h4>{{ t('seo_plugin.ui.recommend_image_size') }}</h4>
					<p>• {{ t('seo_plugin.image_size.pixels') }}<br>• {{ t('seo_plugin.image_size.ratio') }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.field {
	display: flex;
	flex-direction: column;
}

.label {
	margin-bottom: 0.5rem;
}

.seo-image-preview {
	width: 100%;
	container-type: inline-size;
}

.preview-container {
	display: flex;
	gap: 24px;
	align-items: flex-start;

	@container (max-width: 768px) {
		flex-direction: column;
	}
}

.og-preview-container {
	background-color: var(--theme--background-subdued);
	border: 1px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	overflow: hidden;
	width: 500px;
	max-width: 100%;
	margin-top: 0.5rem;

	@container (max-width: 768px) {
		width: 100%;
	}
}

.preview-info {
	flex: 1;
	margin-top: 0.5rem;

	h3 {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 16px;
		line-height: 1.4;
	}

	.recommendations {
		background-color: var(--theme--background-subdued);
		border-radius: var(--theme--border-radius);
		padding: 16px;

		h4 {
			font-size: 14px;
			font-weight: 600;
			margin-bottom: 8px;
		}

		p {
			font-size: 14px;
			color: var(--theme--foreground-subdued);
		}
	}
}

.empty-content {
	display: flex;
	align-items: center;
	justify-content: center;
	text-align: center;
	min-height: 80px;
}

.empty-state-message {
	display: flex;
	flex-direction: column;
	align-items: center;
	color: var(--theme--foreground-subdued);

	p {
		margin-top: 8px;
		font-size: 14px;
	}
}

.og-preview {
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	color: var(--theme--foreground);
	background-color: var(--theme--background);
}

.preview-image-container {
	width: 100%;
	padding-top: 52.5%;
	position: relative;
	background-color: var(--theme--background-subdued);
	border-bottom: 1px solid var(--theme--border-color);
	overflow: hidden;

	::v-deep(> *) {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: flex;
		justify-content: center;
		align-items: center;
	}
}

.preview-content {
	padding: 10px 12px;
}

.preview-domain {
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	margin-bottom: 4px;
	text-transform: uppercase;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.preview-title {
	font-size: 16px;
	font-weight: 600;
	line-height: 1.3;
	margin-bottom: 4px;
	color: var(--theme--foreground);

	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

.preview-description {
	font-size: 14px;
	line-height: 1.4;
	color: var(--theme--foreground-subdued);

	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
	text-overflow: ellipsis;
}

.preview-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.platform-selection {
	margin-bottom: 16px;
}

.platforms-label {
	margin-bottom: 8px;
	font-weight: 600;
	font-size: 14px;
}

.platform-switcher {
	display: flex;
	flex-direction: column;
	position: relative;
	border-left: var(--theme--border-width) solid var(--theme--border-color);
	border-bottom: none;

	@container (max-width: 768px) {
		flex-direction: row;
		border-bottom: var(--theme--border-width) solid var(--theme--border-color);
		border-left: none;
	}
}

.platform-tab {
	background-color: transparent;
	padding: 10px 16px;
	min-width: fit-content;
	display: flex;
	align-items: center;
	font-size: 15px;
	color: var(--theme--foreground-normal);
	user-select: none;
	border: none;
	border-radius: 0 var(--theme--border-radius, 4px) var(--theme--border-radius, 4px) 0;
	cursor: pointer;
	outline: none;
	transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out;
	gap: 8px;
	position: relative;

	@container (max-width: 768px) {
		border-radius: var(--theme--border-radius, 4px) var(--theme--border-radius, 4px) 0 0;
	}

	&:hover {
		color: var(--theme--primary);
		background-color: var(--theme--background-subdued);
	}

	&[data-state='checked'] {
		color: var(--theme--primary);
	}
}

.platform-indicator {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	width: 2px;
	transform: translateX(-1px);

	@container (max-width: 768px) {
		left: 0;
		right: 0;
		bottom: 0;
		top: auto;
		width: 100%;
		height: 2px;
		transform: translateY(1px);
	}

	.indicator-bar {
		background-color: var(--theme--primary);
		width: 100%;
		height: 100%;
		border-radius: 9999px;
	}
}

.og-preview--facebook {
	.preview-content {
		background-color: var(--theme--background-subdued);
	}
	.preview-description {
		-webkit-line-clamp: 1;
	}
}

.og-preview--linkedin {
	border-radius: 2px;
	.preview-content {
		background-color: var(--theme--background);
		padding: 12px;
		display: flex;
		flex-direction: column;
	}
	.preview-title {
		font-weight: 600;
		font-size: 14px;
		order: 1;
	}
	.preview-description {
		font-size: 12px;
		display: none;
		order: 3;
	}
	.preview-domain {
		font-size: 12px;
		order: 2;
	}
}

.og-preview--x {
	background-color: transparent;
	border-radius: var(--theme--border-radius);
	overflow: hidden;

	.preview-image-container {
		position: relative;
		border-bottom: none;
		background-color: transparent;
	}

	.preview-domain-badge {
		position: absolute;
		bottom: 8px;
		left: 8px;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
	}

	/* Only hide content when image exists */
	&:not(:has(.empty-content)) .preview-content {
		display: none;
	}

	/* Keep empty content visible */
	.empty-content {
		display: flex;
	}

	.preview-domain {
		display: none;
	}

	.preview-title {
		display: none;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-description {
		display: none;
	}
}
</style>
