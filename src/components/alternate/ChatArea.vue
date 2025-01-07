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
             :items="currentModelSession?.queries.reverse()"
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
                            Show Results
                        </v-btn>
                    </div>
                </template>
            </v-virtual-scroll>
        </v-card-text>

        <v-card-actions>
            <v-btn color="primary" @click="onShowPosNeg">
                Show Feedback Results
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useModelStore } from '@/stores/model'
import { useItemStore } from '@/stores/item'
import { VVirtualScroll } from 'vuetify/components/VVirtualScroll';
import { ILSets } from '@/types/mediaitem';
import { useAppStore } from '@/stores/app';
import { ExqURFRequest } from '@/types/exq';
import { searchURF } from '@/services/ExquisitorAPI';

interface Props {
    modelId: number
}
const props = defineProps<Props>()

const chatStore = useChatStore()
const modelStore = useModelStore()
const itemStore = useItemStore()

const inputText = ref<string>('')

const currentModelSession = chatStore.getOrCreateChat(props.modelId)
const currentQuery = computed(() => chatStore.currentResultsQuery)

const emit = defineEmits<{
    (e: 'show-search-results', resultIds: number[]): void,
    (e: 'show-urf-results', resultIds: number[]): void
}>()

// Show a previously returned set of results
function onShowResults(query: string, resultIds: number[]) {
    chatStore.currentResultsQuery = query
    emit('show-search-results', resultIds)
}

// Show positive/negative results
async function onShowPosNeg() {
    const activeModelId = modelStore.activeModel!.id
    let pos = itemStore.getSetItems(activeModelId, ILSets.Positives).map((e,_) => e.id)
    let neg = itemStore.getSetItems(activeModelId, ILSets.Negatives).map((e,_) => e.id)
    let hist = itemStore.getSetItems(activeModelId, ILSets.History).map((e,_) => e.id)
    hist.push(...pos)
    hist.push(...neg)
    let exclude : number[] = []
    if (itemStore.modelExcluded.has(activeModelId)) {
        exclude = Array.from(itemStore.modelExcluded.get(activeModelId)!)
    }
    let reqObj : ExqURFRequest = {
        session_info: {
            session: useAppStore().session, 
            modelId: activeModelId,
            collection: modelStore.getModelCollection(activeModelId)
        },
        n: modelStore.activeModel!.settings.itemsToShow,
        pos: pos,
        neg: neg,
        seen: hist,
        excluded: exclude
    }

    // if (checkFilters.value) {
    //     let filters = useFilterStore().getModelFilters(activeModel.value.id)
    //     reqObj.filters = filters
    // }
    let suggs = await searchURF(reqObj)
    emit('show-urf-results', suggs.suggestions)
}

function formatTime(ts: number) {
    return new Date(ts).toLocaleString()
}

async function search() {
    if (inputText.value === '') return
    const resultIds = await chatStore.search(modelStore.activeModel!.id, inputText.value, false)
    await useItemStore().fetchMediaItems(resultIds, props.modelId, modelStore.activeModel!.collection)
    inputText.value = ''
    emit('show-search-results', resultIds)
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
