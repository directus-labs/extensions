<template>
    <div class="tour-group">
        <teleport
            v-if="tourReady"
            to=".tour-group-nav-bar"
        >
            <v-button
                v-if="tourReady"
                @click="startTour"
                class="tour-group-nav-btn"
                v-tooltip="buttonTooltip"
                icon
                x-small
                secondary
            >
                <v-icon
                    :name="buttonIcon"
                    small
                />
            </v-button>
        </teleport>

        <v-form
            :initial-values="initialValues"
            :fields="updatedFields"
            :model-value="values"
            :primary-key="primaryKey"
            :group="field.meta?.field"
            :validation-errors="validationErrors"
            :loading="loading"
            :disabled="disabled"
            :badge="badge"
            :raw-editor-enabled="rawEditorEnabled"
            :direction="direction"
            :show-no-visible-fields="false"
            :show-validation-errors="false"
            @update:model-value="$emit('apply', $event)"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted } from "vue";
    import { useI18n } from "vue-i18n";
    import {
        driver,
        type Driver,
        DriveStep,
        AllowedButtons,
        Config,
    } from "driver.js";
    import type { Field, ValidationError } from "@directus/types";
    import defaults from "./defaults";

    const props = withDefaults(
        defineProps<{
            field: Field;
            fields: Field[];
            values: Record<string, unknown>;
            initialValues: Record<string, unknown>;
            primaryKey: number | string;
            disabled?: boolean;
            batchMode?: boolean;
            batchActiveFields?: string[];
            loading?: boolean;
            validationErrors?: ValidationError[];
            badge?: string;
            rawEditorEnabled?: boolean;
            direction?: string;
            // Options
            steps?: Array<
                DriveStep & { forceClick: boolean; preventBack: boolean }
            >;
            buttonIcon: string;
            buttonTooltip: string;
            exitMessage: string;
        }>(),
        {
            batchActiveFields: () => [],
            validationErrors: () => [],
            // Options
            buttonIcon: defaults.buttonIcon,
            buttonTooltip: defaults.buttonTooltip,
            exitMessage: defaults.exitMessage,
        }
    );

    defineEmits(["apply"]);

    const { updatedFields, injectFieldClasses } = useInjectClasses();
    const { injectButtonBar, rootFormExists } = useInjectButtonBar();
    const { tourReady, initTour, startTour } = useTour();

    onMounted(async () => {
        await injectFieldClasses();
        if (!rootFormExists()) return;
        injectButtonBar();
        initTour();
    });

    function useInjectClasses() {
        const inputClassPrfx = "tour-input";
        const fieldClassPrfx = "tour-field";

        const updatedFields = computed(() => {
            return props.fields.map((field) => {
                if (!field.meta) return field;

                field.meta.options = {
                    ...field.meta?.options,
                    class: `${
                        field.meta?.options?.class
                            ? `${field.meta.options.class} `
                            : ""
                    }${inputClassPrfx}-${field.field}`,
                };

                return field;
            });
        });

        return { updatedFields, injectFieldClasses };

        async function injectFieldClasses() {
            for (const field of props.fields) {
                if (!field.meta?.options?.class) return;

                const maxTries = 6;
                let tries = 0;
                let inputEl: HTMLElement | null;

                do {
                    await delay(!!tries ? 50 : 0);
                    tries++;

                    inputEl = document.querySelector(
                        `.tour-input-${field.field}`
                    );
                } while (!inputEl && tries < maxTries);

                if (!inputEl) return;

                inputEl
                    ?.closest(".field")
                    ?.classList.add(
                        `${fieldClassPrfx}-${field.field}`,
                        "tour-field"
                    );
            }
        }

        function delay(ms: number) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
    }

    function useInjectButtonBar() {
        return { injectButtonBar, rootFormExists };

        function rootFormExists() {
            return !!getRootForm();
        }

        function getRootForm() {
            return document.querySelector("main>.v-form");
        }

        function injectButtonBar() {
            if (!props.steps?.length) return;
            if (!!document.querySelector(".tour-group-nav-bar")) return;

            const rootForm = getRootForm();
            if (!rootForm) return;

            const bar = document.createElement("div");
            bar.classList.add("tour-group-nav-bar");
            rootForm?.prepend(bar);
        }
    }

    function useTour() {
        const { t } = useI18n();
        let tour: Driver;
        let tourBaseConfig: Config;
        let tourSteps: DriveStep[];
        const initialized = ref(false);
        const tourReady = computed(() => initialized.value);

        onUnmounted(destroyTour);

        return { tourReady, initTour, startTour };

        function initTour() {
            if (!props.steps?.length) return;

            tour = driver();

            const themeBorderRadiusCssVar = parseInt(
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--theme--border-radius")
                    .trim()
                    .replace("px", "")
            );

            // NOTE: Must use `setConfig` for each difference to make multiple instances work with driver.js
            tourBaseConfig = {
                showProgress: true,
                progressText: "{{current}}/{{total}}",
                showButtons: ["next", "previous"],
                nextBtnText: t("next"),
                prevBtnText: t("back"),
                doneBtnText: t("done"),
                popoverClass: "tour-group-theme",
                overlayOpacity: 1,
                stagePadding: 12,
                stageRadius: themeBorderRadiusCssVar || 6,
            };

            async function goToNextElement() {
                setTimeout(() => tour.moveTo(tour.getActiveIndex()! + 1), 50);
            }

            tourSteps = props.steps
                .filter(({ element }) => !!element)
                .map(
                    (
                        { element, forceClick, preventBack, ...popover },
                        index
                    ) => {
                        let disableButtons: AllowedButtons[] = [];
                        let onNextClick = () => tour.moveTo(index + 1);
                        let onPrevClick = () => tour.moveTo(index - 1);
                        let onHighlighted = (_el: Element | undefined) => {};

                        if (forceClick) {
                            disableButtons.push("next");
                            onNextClick = () => {};
                            onHighlighted = (el) => {
                                el?.removeEventListener(
                                    "click",
                                    goToNextElement
                                );
                                el?.addEventListener("click", goToNextElement);
                            };
                        }

                        if (preventBack) {
                            disableButtons.push("previous");
                            onPrevClick = () => {};
                        }

                        return {
                            element,
                            popover: {
                                ...popover,
                                disableButtons,
                                onNextClick,
                                onPrevClick,
                            },
                            onHighlighted,
                        };
                    }
                );

            initialized.value = true;
        }

        function destroyTour() {
            tour?.destroy();
        }

        function startTour() {
            if (!tour || !tourSteps?.length) return;

            tour.setConfig({
                ...tourBaseConfig,
                steps: tourSteps,
                onDestroyStarted,
            });
            tour.drive();
        }

        function onDestroyStarted() {
            if (!tour.hasNextStep() || confirm(props.exitMessage)) {
                tour.destroy();
            }
        }
    }
</script>

<style scoped>
    .tour-group {
        position: relative;
    }

    .tour-group-nav-btn {
        --v-icon-color: var(--theme--primary);
        --v-icon-color-hover: var(--v-icon-color);
    }
</style>

<style>
    .tour-group-nav-bar {
        display: flex;
        gap: 4px;
        margin-bottom: -8px;
    }

    @import "driver.js/dist/driver.css";

    /* driver.js overwrites */

    svg.driver-overlay path {
        fill: var(--overlay-color) !important;
    }

    .driver-popover.tour-group-theme * {
        font-family: inherit;
    }

    .driver-popover.tour-group-theme {
        padding: 20px;
        max-width: 360px;
        background-color: var(--theme--background);
        border-radius: var(--theme--border-radius);
        color: var(--theme--foreground);
    }

    .driver-popover.tour-group-theme .driver-popover-description,
    .driver-popover.tour-group-theme .driver-popover-progress-text,
    .driver-popover.tour-group-theme .driver-popover-footer button {
        font-size: 15px;
        line-height: 22px;
        font-weight: 500;
    }

    .driver-popover.tour-group-theme .driver-popover-title {
        font-size: 16px;
        line-height: 1.6;
        font-weight: 600;
        color: var(--theme--foreground-accent);
    }

    .driver-popover.tour-group-theme .driver-popover-progress-text {
        color: var(--theme--foreground-subdued);
    }

    .driver-popover.tour-group-theme .driver-popover-footer button {
        text-shadow: none;
        background-color: var(--theme--background-normal);
        color: var(--theme--foreground);
        border: none;
        border-radius: var(--theme--border-radius);
        padding: 4px 24px;
    }

    .driver-popover.tour-group-theme .driver-popover-footer button:hover {
        background-color: var(--theme--background-accent);
    }

    .driver-popover.tour-group-theme .driver-popover-footer button:focus {
        background-color: var(--theme--background-normal);
    }

    .driver-popover.tour-group-theme
        .driver-popover-arrow-side-left.driver-popover-arrow {
        border-left-color: var(--theme--background);
    }

    .driver-popover.tour-group-theme
        .driver-popover-arrow-side-right.driver-popover-arrow {
        border-right-color: var(--theme--background);
    }

    .driver-popover.tour-group-theme
        .driver-popover-arrow-side-top.driver-popover-arrow {
        border-top-color: var(--theme--background);
    }

    .driver-popover.tour-group-theme
        .driver-popover-arrow-side-bottom.driver-popover-arrow {
        border-bottom-color: var(--theme--background);
    }
</style>
