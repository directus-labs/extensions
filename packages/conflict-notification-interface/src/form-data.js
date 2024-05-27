import { inject, onMounted, ref, unref, watch } from "vue";

export function useFormData() {
    const values = inject('values');
    const regex = /\/content\/([^\/]+)\/(.+)$/;

    const initialValues = ref(unref(values));
    watch(values, (val) => {
        initialValues.value = val;
    }, { once: true });

    const collection = ref('');
    const id = ref('');

    onMounted(() => {
        const result = window.location.pathname.match(regex);
        collection.value = result[1];
        id.value = result[2];
    });

    function fieldChanged(key) {
        const v = unref(values);
        if (key in v === false) return false;
        return v[key] != unref(initialValues)[key];
    }
    function updateField(key, value) {
        initialValues.value[key] = value;
    }

    return { values, initialValues, collection, id, fieldChanged, updateField };
}

