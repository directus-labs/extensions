<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import Upload from './upload.vue';
import { Whiteboard } from './whiteboard';

const props = withDefaults(defineProps<{
	value?: any;
}>(), {

});

const emit = defineEmits(['input']);
const showUpload = ref(false);
const fullscreen = ref(false);

const wb = ref(new Whiteboard());

const interfaceContainer = ref();
const wrapper = ref();
const container = ref();

// eslint-disable-next-line unused-imports/no-unused-vars
function toggleTool(tool: string, image?: any) {
	if (tool === wb.value.currentTool) {
		wb.value.setTool('none');
	}
	else {
		wb.value.setTool(tool);
	}
}

function toggleFullscreen() {
	if (!document.fullscreenElement) {
		fullscreen.value = true;
		interfaceContainer.value.requestFullscreen();
	}
	else if (document.exitFullscreen) {
		fullscreen.value = false;
		document.exitFullscreen();
	}
}

// eslint-disable-next-line unused-imports/no-unused-vars
const resizeObserver = new ResizeObserver((entries) => {
	wb.value.setSize(wrapper.value.clientWidth, wrapper.value.clientHeight);
});

watch(() => props.value, (value: any) => {
	if (wb.value.canvas && JSON.stringify(value) !== JSON.stringify(wb.value.canvas.toJSON())) {
		wb.value.loadFromJSON(value);
	}
});

const keyEvents = function (e) {
	if (e.keyCode === 46 || e.keyCode === 8) {
		wb.value.deleteSelected();
	}
};

onMounted(() => {
	document.addEventListener('keyup', keyEvents);
	wb.value.mount(container.value);

	if (props.value) {
		wb.value.loadFromJSON(props.value);
	}

	wb.value.canvas.on('edit:save', () => {
		emit('input', wb.value.canvas.toJSON());
	});

	resizeObserver.observe(wrapper.value);
});

onUnmounted(() => {
	document.removeEventListener('keyup', keyEvents);
});
</script>

<template>
	<div ref="interfaceContainer" class="whiteboard-container" :class="{ fullscreen }">
		<div ref="wrapper" class="canvas-wrapper">
			<canvas ref="container" height="400" />
		</div>
		<div class="sticky-container">
			<div class="toolbar-wrapper">
				<div class="toolbar">
					<v-button
						v-tooltip.top="'Pencil'"
						small
						:secondary="wb.currentTool !== 'pencil'"
						icon
						@click="toggleTool('pencil')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M167-120q-21 5-36.5-10.5T120-167l40-191 198 198-191 40Zm191-40L160-358l458-458q23-23 57-23t57 23l84 84q23 23 23 57t-23 57L358-160Zm317-600L261-346l85 85 414-414-85-85Z" /></svg>
					</v-button>

					<v-button
						v-tooltip.top="'Eraser'"
						small
						:secondary="wb.currentTool !== 'eraser'"
						icon
						@click="toggleTool('eraser')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z" /></svg>
					</v-button>

					<VDivider vertical />

					<v-button
						v-tooltip.top="'Rectangle'"
						small
						:secondary="wb.currentTool !== 'rect'"
						icon
						@click="toggleTool('rect')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 3H16C18.76 3 21 5.24 21 8V16C21 18.76 18.76 21 16 21H8C5.24 21 3 18.76 3 16V8C3 5.24 5.24 3 8 3Z" /></svg>
					</v-button>

					<v-button
						v-tooltip.top="'Ellipse'"
						small
						:secondary="wb.currentTool !== 'ellipse'"
						icon
						@click="toggleTool('ellipse')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>
					</v-button>

					<v-button
						v-tooltip.top="'Line'"
						small
						:secondary="wb.currentTool !== 'line'"
						icon
						@click="toggleTool('line')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15,3V7.59L7.59,15H3V21H9V16.42L16.42,9H21V3M17,5H19V7H17M5,17H7V19H5" /></svg>
					</v-button>

					<v-button
						v-tooltip.top="'Arrow'"
						small
						:secondary="wb.currentTool !== 'arrow'"
						icon
						@click="toggleTool('arrow')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="m216-160-56-56 464-464H360v-80h400v400h-80v-264L216-160Z" /></svg>
					</v-button>

					<v-button
						v-tooltip.top="'Text'"
						small
						:secondary="wb.currentTool !== 'textbox'"
						icon
						@click="toggleTool('textbox')"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5,4V7H10.5V19H13.5V7H19V4H5Z" /></svg>
					</v-button>

					<v-button
						v-tooltip.top="'Image'"
						small
						:secondary="wb.currentTool !== 'image'"
						icon
						@click="showUpload = true"
					>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" /></svg>
					</v-button>

					<VDivider v-if="wb.selectedShapeType !== 'none' || wb.currentTool !== 'none'" vertical />

					<VMenu
						v-if="wb.selectedShapeType !== 'none' || wb.currentTool !== 'none'"
						placement="top"
					>
						<template #activator="{ toggle }">
							<v-button
								v-tooltip.top="'Fill Color'"
								small
								secondary
								icon
								@click="toggle"
							>
								<svg :style="{ color: wb.color }" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>
								<svg xmlns="http://www.w3.org/2000/svg" class="arrow" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>
							</v-button>
						</template>
						<div class="presets">
							<v-button
								v-for="preset in wb.presets"
								:key="preset.color"
								v-tooltip="preset.name"
								class="preset"
								rounded
								icon
								:class="{ 'low-contrast': preset.lowContrast }"
								:style="{ '--v-button-background-color': preset.color }"
								@click="() => (wb.color = preset.color)"
							/>
						</div>
					</VMenu>

					<template v-if="['pencil', 'line', 'arrow'].indexOf(wb.currentTool) !== -1 || ['path', 'line', 'arrow'].indexOf(wb.selectedShapeType) !== -1">
						<v-button
							v-tooltip.tol="'Small'"
							small
							:secondary="wb.strokeWidth !== 1"
							icon
							@click="wb.strokeWidth = 1"
						>
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M199-199q-9-9-9-21t9-21l520-520q9-9 21-9t21 9q9 9 9 21t-9 21L241-199q-9 9-21 9t-21-9Z" /></svg>
						</v-button>

						<v-button
							v-tooltip.tol="'Medium'"
							small
							:secondary="wb.strokeWidth !== 3"
							icon
							@click="wb.strokeWidth = 3"
						>
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M218-218q-17-17-17-42t17-42l440-440q17-18 42-17.5t42 17.5q17 17 17.5 42T742-658L302-218q-17 17-42 17.5T218-218Z" /></svg>
						</v-button>

						<v-button
							v-tooltip.tol="'Thick'"
							small
							:secondary="wb.strokeWidth !== 5"
							icon
							@click="wb.strokeWidth = 5"
						>
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M235-235q-35-35-35-85t35-85l320-320q35-35 85-35t85 35q35 35 35 85t-35 85L405-235q-35 35-85 35t-85-35Z" /></svg>
						</v-button>
					</template>

					<template v-if="['rect', 'ellipse'].indexOf(wb.currentTool) !== -1 || ['rect', 'ellipse'].indexOf(wb.selectedShapeType) !== -1">
						<VMenu
							placement="top"
						>
							<template #activator="{ toggle }">
								<v-button
									v-tooltip.top="'Line Style'"
									small
									secondary
									icon
									@click="toggle"
								>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3,17H21V15H3V17M3,20H21V19H3V20M3,13H21V10H3V13M3,4V8H21V4H3Z" /></svg>
									<svg xmlns="http://www.w3.org/2000/svg" class="arrow" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>
								</v-button>
							</template>
							<VList>
								<VListItem clickable :active="wb.strokeType === 'solid'" @click="wb.strokeType = 'solid'">
									<VListItemIcon>
										<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M212-212q-11-11-11-28t11-28l480-480q11-12 27.5-12t28.5 12q11 11 11 28t-11 28L268-212q-11 11-28 11t-28-11Z" /></svg>
									</VListItemIcon>
									<VListItemContent>
										Solid
									</VListItemContent>
								</VListItem>
								<VListItem clickable :active="wb.strokeType === 'dashed'" @click="wb.strokeType = 'dashed'">
									<VListItemIcon>
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.29999 18.7C5.11666 18.5167 5.02499 18.2833 5.02499 18C5.02499 17.7167 5.11666 17.4833 5.29999 17.3L9.29999 13.3C9.48333 13.1 9.71249 13 9.98749 13C10.2625 13 10.5 13.1 10.7 13.3C10.8833 13.4833 10.975 13.7167 10.975 14C10.975 14.2833 10.8833 14.5167 10.7 14.7L6.69999 18.7C6.51666 18.8833 6.28333 18.975 5.99999 18.975C5.71666 18.975 5.48333 18.8833 5.29999 18.7Z" fill="currentColor" /><path d="M13.3 10.7C13.1167 10.5167 13.025 10.2833 13.025 10C13.025 9.71667 13.1167 9.48333 13.3 9.3L17.3 5.3C17.4833 5.1 17.7125 5 17.9875 5C18.2625 5 18.5 5.1 18.7 5.3C18.8833 5.48333 18.975 5.71667 18.975 6C18.975 6.28333 18.8833 6.51667 18.7 6.7L14.7 10.7C14.5167 10.8833 14.2833 10.975 14 10.975C13.7167 10.975 13.4833 10.8833 13.3 10.7Z" fill="currentColor" /></svg>
									</VListItemIcon>
									<VListItemContent>
										Dashed
									</VListItemContent>
								</VListItem>
								<VListItem clickable :active="wb.strokeType = 'none'" @click="wb.strokeType = 'none'">
									<VListItemIcon>
										<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q54 0 104-17.5t92-50.5L228-676q-33 42-50.5 92T160-480q0 134 93 227t227 93Zm252-124q33-42 50.5-92T800-480q0-134-93-227t-227-93q-54 0-104 17.5T284-732l448 448Z" /></svg>
									</VListItemIcon>
									<VListItemContent>
										None
									</VListItemContent>
								</VListItem>
							</VList>
						</VMenu>
					</template>

					<template v-if="wb.currentTool === 'textbox' || wb.selectedShapeType === 'textbox'">
						<VMenu
							placement="top"
						>
							<template #activator="{ toggle }">
								<v-button
									v-tooltip.top="'Font Size'"
									small
									secondary
									icon
									@click="toggle"
								>
									<v-icon name="format_size" />
									<svg xmlns="http://www.w3.org/2000/svg" class="arrow" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>
								</v-button>
							</template>
							<VList>
								<VListItem clickable :active="wb.fontSize === 14" @click="wb.fontSize = 14">
									<VListItemContent>
										Small
									</VListItemContent>
								</VListItem>
								<VListItem clickable :active="wb.fontSize === 16" @click="wb.fontSize = 16">
									<VListItemContent>
										Medium
									</VListItemContent>
								</VListItem>
								<VListItem clickable :active="wb.fontSize === 20" @click="wb.fontSize = 20">
									<VListItemContent>
										Large
									</VListItemContent>
								</VListItem>
							</VList>
						</VMenu>
						<VMenu
							placement="top"
						>
							<template #activator="{ toggle }">
								<v-button
									v-tooltip.top="'Text Align'"
									small
									secondary
									icon
									@click="toggle"
								>
									<v-icon :name="(wb.textAlign === 'left' ? 'format_align_left' : (wb.textAlign === 'center' ? 'format_align_center' : 'format_align_right'))" />
									<svg xmlns="http://www.w3.org/2000/svg" class="arrow" viewBox="0 0 24 24"><path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" /></svg>
								</v-button>
							</template>
							<VList>
								<VListItem clickable :active="wb.textAlign === 'left'" @click="wb.textAlign = 'left'">
									<VListItemIcon>
										<v-icon name="format_align_left" />
									</VListItemIcon>
									<VListItemContent>
										Left
									</VListItemContent>
								</VListItem>
								<VListItem clickable :active="wb.textAlign === 'center'" @click="wb.textAlign = 'center'">
									<VListItemIcon>
										<v-icon name="format_align_center" />
									</VListItemIcon>
									<VListItemContent>
										Center
									</VListItemContent>
								</VListItem>
								<VListItem clickable :active="wb.textAlign === 'right'" @click="wb.textAlign = 'right'">
									<VListItemIcon>
										<v-icon name="format_align_right" />
									</VListItemIcon>
									<VListItemContent>
										Right
									</VListItemContent>
								</VListItem>
							</VList>
						</VMenu>
					</template>
				</div>
			</div>
		</div>
		<v-button
			v-tooltip.left="fullscreen ? 'Exit fullscreen' : 'Enter Fullscreen'"
			class="fullscreen-button"
			rounded
			secondary
			icon
			@click="toggleFullscreen()"
		>
			<v-icon :name="fullscreen ? 'fullscreen_exit' : 'fullscreen'" />
		</v-button>
		<Upload v-model="showUpload" @file-selected="$file => wb.insertImage(`/assets/${$file.id}`)" />
	</div>
</template>

<style lang="scss" scoped>
.v-menu-activator .v-button {
	&:deep(.icon) {
		width: calc(var(--v-button-height, 44px) + 12px);
	}
	.arrow {
		height: 18px;
		width: 18px;
		color: var(--theme--foreground-subdued);
		min-width: 18px;
		margin: 0 -4px 0 -2px;
	}
}

.v-button svg {
	position: relative;
	display: inline-block;
	width: var(--v-icon-size, 24px);
	min-width: var(--v-icon-size, 24px);
	height: var(--v-icon-size, 24px);
	color: var(--v-icon-color, currentColor);
	font-size: 0;
	vertical-align: middle;

	path {
		fill: currentColor;
	}
}

.whiteboard-container {
	background-color: var(--theme--form--field--input--background);
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	box-shadow: var(--theme--public--form--field--input--box-shadow);
	position: relative;
	transition:
		border-color var(--fast) var(--transition),
		box-shadow var(--fast) var(--transition);
	--whiteboard-default-height: 400px;

	&:hover {
		border-color: var(--theme--form--field--input--border-color-hover);
		box-shadow: var(--theme--form--field--input--box-shadow-hover);
	}

	.canvas-wrapper {
		height: var(--whiteboard-default-height, 400px);
	}

	&.fullscreen .canvas-wrapper {
		height: 100%;
	}

	canvas {
		width: 100%;
		display: block;
	}

	.sticky-container {
		position: sticky;
		bottom: 0;
		left: 0;
	}

	.toolbar-wrapper {
		position: relative;
	}

	.fullscreen-button {
		position: absolute;
		top: 8px;
		right: 8px;
	}

	.toolbar {
		position: absolute;
		bottom: 8px;
		left: 8px;
		padding: 8px;
		gap: 4px;
		display: flex;
		background-color: var(--theme--form--field--input--background);
		border-radius: var(--theme--popover--menu--border-radius);
		border: 1px solid var(--theme--form--field--input--border-color);
	}
}

.presets {
	display: flex;
	width: 100%;
	margin-bottom: 14px;
	padding: 8px;
	overflow-x: auto;
}

.presets .preset {
	--v-button-background-color-hover: var(--v-button-background-color);
	--v-button-height: 20px;
	--v-button-width: 20px;

	margin: 0px 4px;

	&.low-contrast {
		--v-button-height: 18px;
		--v-button-width: 18px;
		border: 1px solid var(--theme--form--field--input--border-color-hover);
	}
}
</style>
