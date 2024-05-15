<template>
    <v-input v-model="id" :clickable="inputIsClickable" @click="onInputClick" :placeholder="inputPlaceholder">
        <template #prepend>
            <v-select v-model="service" :items="services" inline :placeholder="t('source')"
                placement="bottom-start"></v-select>
        </template>
        <template #append>
            <v-icon v-if="service == 'directus' && !id" name="attach_file" />
            <v-icon v-if="service && id" v-tooltip="t('deselect')" class="deselect" name="close" @click.stop="clearID"
                clickable />
        </template>
    </v-input>

    <drawer-files :active="fileDrawer" @update:active="fileDrawer = false" @input="setFileSelection" />
</template>



<script setup lang="ts">
    import { ref, computed, watch, type Ref } from 'vue';
    import { useI18n } from "vue-i18n";

    type VideoService = 'youtube' | 'vimeo' | 'directus';
    type VideoID = string | number;
    type Video = { service: VideoService; id: VideoID; } | null;

    defineProps<{ value?: Video }>();

    const emit = defineEmits(['input']);

    const { t } = useI18n();

    const { services, service } = useVideoServices();
    const { fileDrawer, fileID, setFileSelection } = useFileSelect()
    const { inputValue, inputIsClickable, inputPlaceholder, onInputClick } = useInputField(service, fileDrawer);
    const { id, clearID } = useVideoID(service, inputValue, fileID);

    watch([service, id], () => {
        const video: Video = service.value && id.value
            ? { service: service.value, id: id.value }
            : null;

        emit('input', video);
    })

    function useVideoServices() {
        const services: { value: VideoService, text: string }[] = [
            {
                value: 'directus',
                text: 'Directus',
            },
            {
                value: 'youtube',
                text: 'YouTube',
            },
            {
                value: 'vimeo',
                text: 'Vimeo',
            },
        ];
        const service = ref<VideoService | null>(null);

        return { service, services }
    }

    function useVideoID(service: Ref<VideoService | null>, inputValue: Ref<VideoID | null | undefined>, fileID: Ref<VideoID | null>) {
        const id = computed({
            get() {
                if (!service.value) return;

                if (service.value == 'directus') return fileID.value;

                return inputValue.value;
            },
            set(newValue) {
                inputValue.value = newValue;
            }
        });

        return { id, clearID }

        function clearID() {
            if (service.value == 'directus') {
                fileID.value = null;
                return;
            }

            id.value = null;
        }
    }

    function useFileSelect() {
        const fileDrawer = ref(false);
        const fileID = ref<VideoID | null>(null);

        return { fileDrawer, fileID, setFileSelection }

        async function setFileSelection(selection: (string | number)[] | null) {
            if (!selection) return;
            fileID.value = selection[0] ?? null;
        }
    }

    function useInputField(service: Ref<VideoService | null>, fileDrawer: Ref<boolean>) {
        const inputValue = ref<VideoID | null>(null);
        const inputIsClickable = computed(() => !service.value || service.value == 'directus');

        const inputPlaceholder = computed(() => {
            if (!service.value) return;

            if (service.value == 'directus') return t('choose_from_library');

            return `Video ID …`;
        });

        return { inputValue, inputIsClickable, inputPlaceholder, onInputClick };

        function onInputClick(e: MouseEvent) {
            if (!inputIsClickable.value) return;

            const clickOnMenu = !!(e.target as HTMLElement)?.closest('.prepend .v-select');

            if (!clickOnMenu && service.value == 'directus') {
                fileDrawer.value = true;
                return;
            }
        }
    }
</script>



<style scoped>
    .v-input :deep(.input .prepend) {
        margin-right: 16px;
    }

    .deselect:hover {
        --v-icon-color-hover: var(--theme--danger);
    }
</style>