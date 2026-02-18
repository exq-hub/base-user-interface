<template>
    <v-dialog v-model="isOpen" max-width="1080">
        <v-card :disabled="loadingResults" :loading="loadingResults">
            <template v-slot:loader="{ isActive }">
                <v-progress-linear
                 :active="isActive"
                 color="primary"
                 height="4"
                 indeterminate
                ></v-progress-linear>
            </template>
            <v-card-title>Temporal Search</v-card-title>
            <v-card-text>
                Select the order of events
            </v-card-text>
            <div class="d-flex">
                <v-card 
                 v-for="q in temporalSelection" 
                 :key="q.id"
                 class="ma-2"
                 @click="addOrRemoveSelection(q)"
                >
                    <v-card-item class="text-center text-h6" style="border:2px solid; color:#1565C0;">
                        {{ orderedSelection.indexOf(q) + 1 }}
                    </v-card-item>
                    <v-card-title>{{ q.name }}</v-card-title>
                    <v-card-text>
                        <div v-if="q.searchType === 'text'">
                            <strong>Text Query:</strong> {{ q.text }}
                        </div>
                        <div v-if="q.searchType === 'image'">
                            <strong>Image Query:</strong>
                            <v-img :src="q.name" max-width="200" />
                        </div>
                        <div>
                            <strong>Filters:</strong>
                            <ul>
                                <li v-for="(values, filterId) in q.filters" :key="filterId">
                                    {{ filterId }}: 
                                    <span v-for="value in values" :key="value.value">
                                        {{ value.value }}
                                        {{ values.indexOf(value) < values.length - 1 ? ', ' : '' }}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </v-card-text>
                </v-card>
            </div>
            <v-card-actions>
                <v-btn
                 class=""
                 color="error"
                 variant="outlined"
                 @click="clearOrderedSelection; logEvents([{
                    ts: Date.now(),
                    action: 'Clear Temporal Search Order',
                    session: useAppStore().session, 
                 }])"
                >
                    Clear Order
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn 
                 class=""
                 color="primary" 
                 variant="outlined"
                 :disabled="orderedSelection.length !== temporalSelection.length || orderedSelection.length === 0"
                 @click="search"
                >
                    Search
                </v-btn>
                <v-btn variant="outlined" @click="close">
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { logEvents } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useTemporalSearchStore } from '@/stores/temporalSearchStore';
import { ChatQuery } from '@/types/chat';
import { storeToRefs } from 'pinia';

const tempStore = useTemporalSearchStore()
const { isOpen, temporalSelection, loadingResults } = storeToRefs(tempStore)

const orderedSelection = ref<ChatQuery[]>([])

const emit = defineEmits(['show-temporal-results'])

function close() {
    tempStore.close()
    clearOrderedSelection()
    logEvents([{
        ts: Date.now(),
        action: 'Close Temporal Search Dialog',
        session: useAppStore().session, 
    }])
}

function addOrRemoveSelection(q: ChatQuery) {
    const index = orderedSelection.value.indexOf(q)
    if (index === -1) {
        orderedSelection.value.push(q)
    } else {
        orderedSelection.value.splice(index, 1)
    }
    logEvents([{
        ts: Date.now(),
        action: index === -1 ? 'Add Temporal Query to Selection' : 'Remove Temporal Query from Selection',
        session: useAppStore().session, 
        data: JSON.stringify({
            queryId: q.id,
            queryName: q.name,
        })
    }])
}

function clearOrderedSelection() {
    orderedSelection.value.splice(0, orderedSelection.value.length)
}

async function search() {
    logEvents([{
        ts: Date.now(),
        action: 'Execute Temporal Search',
        session: useAppStore().session, 
        data: JSON.stringify({
            orderedQueryIds: orderedSelection.value.map(q => q.id),
        })
    }])
    const resultIds = await tempStore.search(orderedSelection.value)
    emit('show-temporal-results', resultIds)
    close()
}

watch(isOpen, (newVal) => {
    if (!newVal) {
        clearOrderedSelection()
        const event: ClientEvent = {
            ts: Date.now(),
            action: 'Close Temporal Search Dialog',
            session: useAppStore().session, 
        }
        logEvents([event])
    } else {
        orderedSelection.value.push(...temporalSelection.value.slice())
        const event: ClientEvent = {
            ts: Date.now(),
            action: 'Open Temporal Search Dialog',
            session: useAppStore().session, 
        }
        logEvents([event])
    }
})

</script>

<style scoped>

</style>