<script setup lang="ts">
import { defineProps, onMounted, ref } from 'vue';

defineProps<{
	title: string;
	metaDescription: string;
	collection: string;
}>();

function getFavicon(): string {
	// Check for favicon in different possible locations in current document
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
	return window.document.title.split('·')[1].trim();
}

function truncate(text: string, maxLength: number): string {
	if (!text)
		return '';
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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
						@error="$event.target.innerHTML = '🌐'"
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
	border: 2px solid var(--theme--border-color);
	border-radius: var(--theme--border-radius);
	padding: 1.5rem;
	background-color: var(--theme--background);
}
.search-preview {
	padding: 0;
	border: 1px solid var(--theme--border--color);
	border-radius: var(--theme--border-radius);
	font-family: arial, sans-serif;
	max-width: 600px;
}

.preview-url-text {
	width: 100%;
	flex: 1;
	min-width: 0;
	color: color-mix(in srgb, var(--theme--foreground), #fff 20%);
	font-size: 12px;
}
.preview-url {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 4px;
	font-size: 12px;
	color: #202124;
	line-height: 1.3;
}
.preview-url-favicon {
	margin-right: 4px;
}
.preview-url-arrow {
	flex-shrink: 0;
	margin: 0 4px;
}
.preview-title {
	color: var(--theme--primary);
	font-size: 20px;
	line-height: 1.3;
	margin-bottom: 3px;
	font-weight: 400;
	cursor: pointer;
}
.preview-title:hover {
	text-decoration: underline;
}
.preview-description {
	color: #4d5156;
	font-size: 14px;
	line-height: 1.58;
	word-wrap: break-word;
}

.preview-url-text p {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.url-path-container {
	display: flex;
	align-items: center;
}

.preview-url-path {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
