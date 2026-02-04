<template>
    <v-dialog v-model="show" persistent max-width="500px">
        <template v-slot:activator="{ props }">
            <v-btn 
             data-eid="add_model_btn"
             color="black" 
             style="background-color: white;" 
             density="compact" 
             class="v-btn--flat" 
             icon="mdi-plus" 
             v-bind="props"
            />
        </template>
        <v-card>
            <v-card-title>Select a Collection</v-card-title>
            <v-card-text>
                <v-select
                 data-eid="select_collection_dropdown"
                 v-model="selectedCollection"
                 :items="collections"
                 label="Available Collections"
                />
            </v-card-text>
            <v-card-actions>
                <v-btn data-eid="cancel_add_model_btn" text @click="onCancel">Cancel</v-btn>
                <v-btn data-eid="confirm_add_model_btn" color="primary" @click="onConfirm">Confirm</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { logEvents } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { ref } from 'vue'

const props = defineProps<{
    availableCollections: {name: string, description?: string}[]
}>()

const collections = props.availableCollections.map(((val) => val.name))

const emit = defineEmits<{
    (e: 'confirm', collectionId: string): void
    (e: 'cancel'): void
}>()

const show = ref(false)
const selectedCollection = ref<string>('')

function onCancel() {
    show.value = false
    emit('cancel')
}

function onConfirm() {
    if (!selectedCollection.value) return
    show.value = false
    emit('confirm', selectedCollection.value)
}

watch(show, (newVal) => {
    if (newVal) {
        selectedCollection.value = ''
        logEvents([{
            ts: Date.now(),
            action: 'Open Add Model Dialog',
            session: useAppStore().session,
            element_id: 'add_model_dialog'
        }])
    } else {
        logEvents([{
            ts: Date.now(),
            action: 'Close Add Model Dialog',
            session: useAppStore().session,
            element_id: 'add_model_dialog'
        }])
    }
})
</script>
