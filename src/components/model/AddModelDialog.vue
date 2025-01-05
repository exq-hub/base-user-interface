<template>
    <v-dialog v-model="show" persistent max-width="500px">
        <template v-slot:activator="{ props }">
            <v-btn 
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
                 v-model="selectedCollection"
                 :items="collections"
                 label="Available Collections"
                />
            </v-card-text>
            <v-card-actions>
                <v-btn text @click="onCancel">Cancel</v-btn>
                <v-btn color="primary" @click="onConfirm">Confirm</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
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
</script>
