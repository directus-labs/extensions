<script lang="ts">
import type { AxiosProgressEvent } from 'axios';
import type { Payload } from '../types/extension';
import { useApi } from '@directus/extensions-sdk';
import { defineComponent, reactive, ref } from 'vue';
import { md } from '../utils/md';
import SupportNavigation from './components/navigation.vue';

type Options = 'content' | 'users' | 'comments' | 'presets' | 'dashboards' | 'extensions' | 'flows' | 'force';

export default defineComponent({
	components: {
		SupportNavigation,
	},
	setup() {
		const baseURL = ref<string>('');
		const token = ref<string>('');
		const lockInterface = ref<boolean>(false);
		const isValidating = ref<boolean>(false);
		const validationMessage = ref<{ status: string; icon: string; message: string } | null>();
		const page_description = 'Migrate the current Directus instance to another location with ease, using this simple module.';
		const response = ref<Record<string, any>>({});
		const dataChunk = ref('');
		const dryRun = ref<boolean>(true);
		const forceSchema = ref<boolean>(false);

		const migrationOptions = ref<{
			label: string;
			value: string;
		}[]>([
			{
				label: 'Content',
				value: 'content',
			},
			{
				label: 'Users',
				value: 'users',
			},
			{
				label: 'Comments',
				value: 'comments',
			},
			{
				label: 'Bookmarks',
				value: 'presets',
			},
			{
				label: 'Insights',
				value: 'dashboards',
			},
			{
				label: 'Extensions',
				value: 'extensions',
			},
			{
				label: 'Flows',
				value: 'flows',
			},
		]);

		const migrationOptionsSelections = ref<Options[]>(migrationOptions.value.map((o) => o.value as Options));

		const scope = reactive<Record<Options, boolean>>({
			users: false,
			content: false,
			comments: false,
			presets: false,
			dashboards: false,
			extensions: false,
			flows: false,
			force: false,
		});

		const api = useApi();

		const checkHost = async ({ baseURL, token }: Payload): Promise<void> => {
			isValidating.value = true;
			const response = await api.post('/migration/check', { baseURL, token, scope });
			isValidating.value = false;
			validationMessage.value = response ? response.data : { status: 'danger', icon: 'error', message: 'An unknow error occured. Please check logs for more information' };
		};

		const extractSchema = async ({ baseURL, token, dryRun }: Payload): Promise<void> => {
			lockInterface.value = true;
			dataChunk.value = '';

			migrationOptionsSelections.value.forEach((o) => {
				scope[o] = true;
			});

			scope.force = forceSchema.value;

			response.value = await api.post(`/migration/${dryRun ? 'dry-run' : 'run'}`, { baseURL, token, scope }, {
				onDownloadProgress: (progressEvent: AxiosProgressEvent) => {
					let eventObj: XMLHttpRequest | undefined;

					if (progressEvent.event?.currentTarget) {
						eventObj = progressEvent.event?.currentTarget;
					}
					else if (progressEvent.event?.srcElement) {
						eventObj = progressEvent.event?.srcElement;
					}
					else if (progressEvent.event?.target) {
						eventObj = progressEvent.event?.target;
					}

					if (!eventObj)
						return;
					dataChunk.value = eventObj.response;
				},
			});

			if (response.value.ok) {
				lockInterface.value = false;
			}
		};

		return { baseURL, token, scope, migrationOptions, migrationOptionsSelections, page_description, lockInterface, checkHost, extractSchema, response, dryRun, forceSchema, dataChunk, md, isValidating, validationMessage };
	},
});
</script>

<template>
	<private-view title="Migrate Directus">
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="cloud_upload" outline />
			</v-button>
		</template>
		<template #navigation>
			<SupportNavigation collection="home" />
		</template>
		<div class="migration-container">
			<div class="migration-main">
				<p>To get started, enter the destination URL and admin token below, then click <strong>Check</strong>. This will compare both Directus platform and see if they are compatible. Please make sure the destination instance is on the same version and the same database engine as this instance.</p>
				<div class="migration-input-container">
					<div class="migration-input">
						<v-input v-model="baseURL" label="Destination URL" placeholder="https://" :disabled="isValidating || lockInterface" />
						<v-input v-model="token" label="Admin Token" placeholder="**********" :disabled="isValidating || lockInterface" />
						<v-button :disabled="lockInterface" :loading="isValidating" @click="checkHost({ baseURL, token })">
							Check
						</v-button>
					</div>

					<div v-if="validationMessage" class="migration-validation">
						<v-notice :icon="validationMessage.icon" :type="validationMessage.status">
							{{ validationMessage.message }}
						</v-notice>
						<v-checkbox
							v-if="validationMessage.message.includes('force')"
							v-model="forceSchema"
							label="Force"
							:disabled="lockInterface"
						>
							Force
						</v-checkbox>
					</div>

					<div v-if="forceSchema || (validationMessage && validationMessage.status === 'success')" class="migration-start">
						<div class="migration-options">
							<v-select
								v-model="migrationOptionsSelections"
								:items="migrationOptions"
								:disabled="lockInterface"
								:multiple-preview-threshold="1"
								item-text="label"
								item-value="value"
								item-icon="icon"
								all-items-translation="Migration Options"
								item-count-translation="Migration Options"
								placeholder="Migration Options"
								multiple
							>
								<template #prepend>
									<v-icon name="tune" />
								</template>
							</v-select>
						</div>
						<v-checkbox
							v-model="dryRun"
							label="Dry Run"
							:disabled="lockInterface"
						>
							Dry Run
						</v-checkbox>
						<v-button :disabled="lockInterface" @click="extractSchema({ baseURL, token, dryRun })">
							Start
						</v-button>
					</div>
				</div>

				<div class="migration-transcript" v-html="md(dataChunk)" />
			</div>
		</div>

		<template #sidebar>
			<sidebar-detail icon="info" title="Information" close>
				<div v-md="page_description" class="page-description" />
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style>
	.migration-container {
	padding: 0 var(--content-padding) 0 calc(var(--content-padding) + var(--content-padding));
	padding-bottom: var(--content-padding-bottom);
	display: flex;
	justify-content: space-between;
}

.migration-main {
	max-width: 800px;
	margin-bottom: 3em;
	padding: 0 var(--content-padding);
}

.migration-input-container {
	padding: var(--theme--form--field--input--padding);
	background-color: var(--theme--background-subdued);
	border: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--v-input-border-radius, var(--theme--border-radius));
	box-shadow: var(--theme--form--field--input--box-shadow);
	margin-bottom: 20px;
}

.migration-input {
	display: grid;
	grid-template-columns: 2fr 2fr 1fr;
	gap: 20px;
}

.migration-input:has(+ .migration-validation) {
	margin-bottom: 20px;
}

.migration-validation {
	display: flex;
	align-items: start;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	margin-bottom: 20px;
}

.migration-validation:has(+ .migration-start) {
	margin-bottom: 20px;
}

.migration-validation .v-checkbox {
	padding-top: 12px;
	padding-right: 20px;
}

.migration-start {
	display: flex;
	justify-content: end;
}

.migration-start .v-input {
	max-width: 300px;
}

.migration-options {
	flex-grow: 1;
}

.migration-start .v-checkbox {
	padding-left: 12px;
	padding-right: var(--theme--form--field--input--padding);
	margin-right: 20px;
}

@media (max-width: 700px) {
	.migration-input {
		grid-template-columns: 1fr;
	}

	.migration-start {
		flex-wrap: wrap;
	}

	.migration-start .v-input {
		max-width: auto;
		margin-bottom: 20px;
	}
}

.migration-container h2,
.migration-container h3 {
	font-weight: bold;
	margin-bottom: 0.5em;
}

.migration-container h2 {
	font-size: 1.4em;
}

.migration-transcript h2 {
	margin-top: 24px;
}

.migration-container h3 {
	font-size: 1.2em;
}

.migration-container h3.skip {
	color: var(--theme--form--field--input--foreground-subdued);
}

.migration-container p {
	margin-bottom: 1em;
}

.migration-container p a {
	font-weight: bold;
	color: var(--theme--primary);
}

.migration-container ul {
	margin-bottom: 1em;
}

.migration-container li p {
	margin-bottom: 0;
}

.migration-sidecar {
	width: calc(100% - 840px);
}

h3.done .icon,
h3.skipped .icon,
h3.error .icon {
	position: relative;
	display: inline-block;
	width: 24px;
	min-width: 24px;
	height: 20px;
	font-size: 0;
	vertical-align: middle;
}

h3.done .icon {
	color: var(--theme--success);
}

h3.error .icon {
	color: var(--theme--danger);
}

h3.skipped .icon {
	color: var(--theme--form--field--input--foreground-subdued);
}

h3.done .icon i,
h3.error .icon i,
h3.skipped .icon i {
	display: block;
	font-family: 'Material Symbols';
	font-weight: normal;
	font-size: 18px;
	font-style: normal;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-rendering: optimizeLegibility;
	font-feature-settings: 'liga';
	font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

h3.done .icon i::after {
	content: 'check';
}

h3.error .icon i::after {
	content: 'error';
}

h3.skipped .icon i::after {
	content: 'fast_forward';
}

.migration-transcript .progress-circular {
	position: relative;
	display: inline-block;
	width: 16px;
	height: 16px;
	margin-right: 8px;
}

.migration-transcript .progress-circular .circle.indeterminate {
	animation: progress-circular-rotate var(--v-progress-circular-speed, 2s) infinite linear;
}

.migration-transcript .progress-circular .circle {
	position: absolute;
	top: 0;
	left: 0;
	width: 16px;
	height: 16px;
}

.migration-transcript .progress-circular .circle-background {
	fill: transparent;
	stroke: var(--v-progress-circular-background-color, var(--theme--form--field--input--border-color));
	stroke-width: var(--v-progress-circular-line-size, 3px);
}

.migration-transcript .progress-circular .circle.indeterminate .circle-path[data-v-0b5afddc] {
	animation: progress-circular-stroke var(--v-progress-circular-speed, 2s) infinite linear;
}

.migration-transcript .progress-circular .circle-path {
	transition: stroke-dasharray var(--v-progress-circular-transition, 400ms) ease-in-out;
	fill: transparent;
	stroke: var(--v-progress-circular-color, var(--theme--foreground));
	stroke-width: 3px;
}

@keyframes progress-circular-rotate {
	0% {
		transform: rotate(0deg);
	}
	50% {
		transform: rotate(360deg);
	}
	100% {
		transform: rotate(1080deg);
	}
}

@keyframes progress-circular-stroke {
	0% {
		stroke-dasharray: 0, 78.5px;
	}
	50% {
		stroke-dasharray: 78.5px, 78.5px;
	}
	100% {
		stroke-dasharray: 0, 78.5px;
	}
}

.migration-container .pending:has(+ .done) {
	display: none;
}

.migration-container .pending:has(+ .error) .progress-circular {
	display: none;
}
</style>
