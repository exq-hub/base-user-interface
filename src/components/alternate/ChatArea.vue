<!-- src/components/ChatArea.vue -->
<template>
    <v-card>
        <!-- <v-card-title></v-card-title> -->
        <v-card-text>
            <div>
                <v-text-field
                 v-model="inputText"
                 label="Enter search query"
                 @keyup.enter="search"
                />
                <v-btn @click="search">Search</v-btn>
            </div>

            <!-- Chat History -->
            <v-virtual-scroll
             ref="scroller"
             :items="currentModelSession?.queries"
             height="70vh"
            >
                <template v-slot:default="{ item }">
                    <div class="pa-2" :class="{highlight : item.text === currentQuery}">
                        <div class="font-weight-bold">{{ item.text }}</div>
                        <div class="text-caption">Time: {{ formatTime(item.timestamp) }}</div>
                        <v-btn
                         text
                         @click="onShowResults(item.text, item.resultIds)"
                        >
                            Show These Results
                        </v-btn>
                    </div>
                </template>
            </v-virtual-scroll>
        </v-card-text>

        <v-card-actions>
            <v-btn color="primary" @click="onShowPosNeg">
                Show Positive/Negative Results
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/alternate/chat'
import { searchVLM } from '@/services/ExquisitorAPI'
import { useFilterStore } from '@/stores/filter'
import { ExqTextSearchRequest } from '@/types/exq'
import { useAppStore } from '@/stores/app'
import { useModelStore } from '@/stores/model'
import { useItemStore } from '@/stores/item'
import { VVirtualScroll } from 'vuetify/components/VVirtualScroll';

interface Props {
    modelId: number
}
const props = defineProps<Props>()

const chatStore = useChatStore()
const session = useAppStore().session
const modelStore = useModelStore()

const inputText = ref<string>('')

const currentModelSession = chatStore.getOrCreateChat(props.modelId)
const currentQuery = computed(() => chatStore.currentResultsQuery)

const emit = defineEmits<{
    (e: 'show-search-results', resultIds: number[]): void,
    (e: 'show-urf-results'): void
}>()

// Show a previously returned set of results
function onShowResults(query: string, resultIds: number[]) {
    chatStore.currentResultsQuery = query
    emit('show-search-results', resultIds)
}

// Show positive/negative results
function onShowPosNeg() {
    emit('show-urf-results')
}

function formatTime(ts: number) {
    return new Date(ts).toLocaleString()
}

async function search() {
    // loading.value = true
    let reqObj : ExqTextSearchRequest = {
        session_info: {
            session: session,
            collection: modelStore.activeModel!.collection,
            modelId: props.modelId
        },
        n: modelStore.activeModel!.settings.itemsToShow,
        text: inputText.value,
        seen: [],
        filters: {
            names: [],
            values: []
        },
        excluded: []
    }
    // if (checkFilters.value) {
        // let filters = useFilterStore().getModelFilters(modelStore.activeModel!.id)
        // reqObj.filters = filters
    // }
    // if (checkHistory.value) {
    //     let pos = itemStore.getSetItems(activeModel.value.id, ILSets.Positives).map((e,_) => e.id)
    //     let neg = itemStore.getSetItems(activeModel.value.id, ILSets.Negatives).map((e,_) => e.id)
    //     let hist = itemStore.getSetItems(activeModel.value.id, ILSets.History).map((e,_) => e.id)
    //     hist.push(...pos)
    //     hist.push(...neg)
    //     hist.push(...activeModel.value.grid[0].items)
    //     reqObj.seen = hist
    // }
    const resultIds = await searchVLM(reqObj).then((res) => {
        // loading.value = false
        // loaded.value = true
        return res
    })
    console.log('resultIds:', resultIds)
    chatStore.addQueryToChat(props.modelId, inputText.value, resultIds.vlmResults)
    await useItemStore().fetchMediaItems(resultIds.vlmResults, props.modelId, modelStore.activeModel!.collection)
    inputText.value = ''
    emit('show-search-results', resultIds.vlmResults)
}

</script>

<style scoped>
/* Basic styling here */
.highlight {
    border: 1px solid;
    border-radius: 4px;
    border-color: aqua;
}
</style>
