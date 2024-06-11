<template>
    <div ref="el">
        <v-notice v-if="!targetBuilder" type="warning"
            :icon="`vertical_align_${target == 'above' ? 'top' : 'bottom'}`">No Builder (M2A) field found {{ target
            }} this field!</v-notice>
    </div>

    <Teleport v-if="!!targetBuilder" :to="targetBuilder">
        <div v-if="buttonMatrix.length" class="btn-matrix">
            <v-divider v-if="label" inline-title class="label">{{ label }}</v-divider>

            <div class="grid">
                <v-button v-for="button, index in buttonMatrix" @click="triggerClick(index)" secondary full-width>
                    <v-icon :name="button.icon"></v-icon>
                    <v-text-overflow :text="button.label" />
                </v-button>
            </div>
        </div>
    </Teleport>
</template>



<script setup lang="ts">
    import { ref, onMounted, watch, nextTick, type Ref } from 'vue';

    type MaybeHTML = HTMLElement | null | undefined;
    type MaybeHTMLRef = Ref<MaybeHTML>;
    type MatrixButton = { label: string; icon: string; };

    interface Props {
        value: string;
        target: 'above' | 'below',
        field: any,
    };

    const props = withDefaults(defineProps<Props>(), { target: 'below' });

    const el = ref<HTMLElement>();

    const { targetBuilder } = useNearestBuilderField(el, { onFound: () => removeParentDomElement(el) });
    const { label, buttonMatrix, triggerClick } = useButtonMatrix(targetBuilder);

    function useNearestBuilderField(el: MaybeHTMLRef, { onFound }: { onFound: Function }) {
        const targetBuilder: MaybeHTMLRef = ref();

        onMounted(() => {
            const targetSibling = props.target == 'above' ? 'previousElementSibling' : 'nextElementSibling';
            targetBuilder.value = el.value?.closest('.field')?.[targetSibling]?.querySelector('.m2a-builder');

            if (!!targetBuilder.value) onFound();
        });

        return { targetBuilder };
    }

    function removeParentDomElement(el: MaybeHTMLRef) {
        el.value?.closest('.field')?.remove()
    }

    function useButtonMatrix(targetBuilder: MaybeHTMLRef) {
        const label = ref('');
        const buttonMatrix = ref<MatrixButton[]>([]);
        let popupId = '';
        let firstActionButton: MaybeHTML;

        watch(() => targetBuilder.value, setup, { once: true });

        return { label, buttonMatrix, triggerClick };

        async function setup() {
            const firstAction: MaybeHTML = targetBuilder.value?.querySelector('.actions>.v-menu');
            firstActionButton = firstAction?.querySelector('.v-button button');
            if (!firstActionButton) return;

            label.value = firstActionButton.innerText ?? '';

            await delay(100);
            firstActionButton.click();
            await nextTick();

            hideActionButton(firstAction!);

            const popup = findAndHandlePopup();
            if (!popup) return;

            createButtonMatrix(popup);
            hideAndClosePopup(popup);
        }

        function findAndHandlePopup() {
            const popup = document.querySelector('#menu-outlet .v-menu-popper.active:not([data-hacked])');
            if (!popup) return;

            (popup as HTMLElement).dataset.hacked = 'hacked';
            popupId = `#${popup.id}`;

            return popup as HTMLElement;
        }

        function createButtonMatrix(popup: HTMLElement) {
            popup.querySelectorAll('.v-list-item.link.clickable')?.forEach((button) => {
                const label = (button as HTMLElement).innerText;
                const icon = (button.querySelector('.v-icon [data-icon]') as HTMLElement)?.dataset?.icon ?? 'database';

                buttonMatrix.value.push({ label, icon });
            });
        }

        function hideActionButton(button: HTMLElement) {
            button.style.visibility = 'hidden';
            button.style.display = 'block';
            button.style.position = 'absolute';
        }

        async function hideAndClosePopup(popup: HTMLElement) {
            popup.style.visibility = 'hidden';
            await delay(100);
            document.body.click();
        }

        async function triggerClick(index: number) {
            if (!popupId) return;

            firstActionButton?.click();
            await nextTick();

            const popup = document.querySelector(popupId);

            (popup?.querySelectorAll('.v-list-item.link.clickable')?.[index] as HTMLElement)?.click();
        }

        function delay(ms: number) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
    }
</script>



<style scoped>
    :global(.m2a-builder:has(.btn-matrix) .actions) {
        margin-top: 0px;
    }

    :global(.m2a-builder:has(.btn-matrix) .actions:has(.v-menu + .v-menu)) {
        margin-top: 8px;
    }

    .btn-matrix {
        margin-top: 8px;
    }

    .label {
        margin-bottom: 8px;
    }

    .grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
    }

    .v-button :deep(.content) {
        --v-icon-color: var(--theme--foreground-subdued);
        gap: 6px;

        flex-direction: column;
    }

    .v-button {
        --v-button-height: 100px;
    }

    .v-text-overflow {
        width: 100%;
    }

    .v-divider :deep(.type-text) {
        color: var(--theme--foreground-subdued);
    }
</style>