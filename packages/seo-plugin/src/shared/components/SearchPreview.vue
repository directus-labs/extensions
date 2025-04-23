<script setup lang="ts">
import { defineProps, onMounted, ref } from 'vue';
import { truncate } from '../utils';

defineProps<{
	title: string;
	metaDescription: string;
	collection: string;
}>();

function getFavicon(): string {
	const favicon =
		// Check apple-touch-icon first (usually higher quality)
		window.document.querySelector('link[rel=\'apple-touch-icon\']')?.getAttribute('href')
		// Check for explicit favicon link
		|| window.document.querySelector('link[rel=\'icon\']')?.getAttribute('href')
		|| window.document.querySelector('link[rel=\'shortcut icon\']')?.getAttribute('href')
		// Fallback to default favicon.ico
		|| '/favicon.ico';

	return favicon;
}

const websiteUrl = ref('');

onMounted(() => {
	// Use current Directus URL for search preview @TODO: Maybe make this configurable if confusing?
	if (typeof window !== 'undefined') {
		websiteUrl.value = window.location.origin;
	}
});

function getProjectName(): string {
	return window?.document?.title?.split('·')[1]?.trim() || '';
}
</script>

<template>
	<div class="field">
		<label class="label field-label type-label">Search Preview</label>
		<div class="search-container">
			<div class="search-preview">
				<div class="preview-url">
					<img
						:src="getFavicon()"
						class="preview-url-favicon"
						width="20"
						height="20"
						alt="favicon"
						@error="($event.target as HTMLImageElement).src = '🌐'"
					>
					<div class="preview-url-text">
						<p class="truncate">
							{{ getProjectName() }}
						</p>
						<p class="url-path-container truncate">
							<span class="preview-url-path">{{ websiteUrl }}</span>
							<span class="preview-url-arrow">›</span>
							<span class="preview-url-path">{{ collection }}</span>
						</p>
					</div>
				</div>
				<div class="preview-title">
					{{ truncate(title, 60) || 'Enter a title to see preview' }}
				</div>
				<div class="preview-description">
					{{ truncate(metaDescription, 160) || 'Enter a meta description to see preview' }}
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

.search-container {
	background-color: var(--theme--background);
	border: 2px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	padding: 1.5rem;
}

.search-preview {
	border-radius: var(--theme--border-radius);
	font-family: arial, sans-serif;
	max-width: 600px;
	padding: 0;
}

.preview-url {
	align-items: center;
	color: var(--theme--foreground);
	display: flex;
	font-size: 12px;
	gap: 8px;
	line-height: 1.3;
	margin-bottom: 4px;

	.preview-url-favicon {
		margin-right: 4px;
	}

	.preview-url-text {
		color: color-mix(in srgb, var(--theme--foreground), #fff 20%);
		flex: 1;
		font-size: 12px;
		min-width: 0;
		width: 100%;

		p {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	.url-path-container {
		align-items: center;
		display: flex;

		.preview-url-arrow {
			flex-shrink: 0;
			margin: 0 4px;
		}

		.preview-url-path {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}
}

.preview-title {
	color: var(--theme--primary);
	cursor: pointer;
	font-size: 20px;
	font-weight: 400;
	line-height: 1.3;
	margin-bottom: 3px;

	&:hover {
		text-decoration: underline;
	}
}

.preview-description {
	color: var(--theme--foreground-subdued);
	font-size: 14px;
	line-height: 1.58;
	word-wrap: break-word;
}
</style>
