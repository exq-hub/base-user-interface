<!-- src/components/ChatArea.vue -->
<template>
    <v-card data-eid="chat_area_card">
        <!-- <v-card-title></v-card-title> -->
        <v-card-text>
            <div class="pb-5">
                <v-text-field
                 v-model="inputText"
                 data-eid="chat_input_field"
                 label="Enter search query"
                 @keyup.enter="search"
                />
                <div class="d-flex align-center ga-2">
                    <v-btn
                     data-eid="chat_search_btn"
                     color="primary"
                     @click="search">
                     <v-icon>mdi-magnify</v-icon>
                     <v-divider class="border-opacity-0" vertical :thickness="5"/>
                     Search
                    </v-btn>

                    <v-btn
                     data-eid="chat_adv_search_btn"
                     color="primary"
                     @click="openAdvancedFromBar"
                     >
                        <v-icon>mdi-filter-outline</v-icon>
                        <v-divider class="border-opacity-0" vertical :thickness="5"/>
                    </v-btn>
                    <v-spacer />
                    <v-btn
                     data-eid="chat_image_upload_btn"
                     color="primary"
                     @click="openImageUploadDialog"
                    >
                        <v-icon>mdi-image-plus</v-icon>
                    </v-btn>
                    <!-- <v-radio-group
                     v-model="search_type"
                     inline
                    >
                        <v-radio
                         label="CLIP"
                         value="clip"
                        />
                        <v-radio
                         label="Caption"
                         value="caption"
                        />
                        <v-radio
                         label="Aggregate"
                         value="aggregate"
                        />
                    </v-radio-group> -->
                </div>
            </div>

            <!-- Chat History -->
            <v-virtual-scroll
             ref="scroller"
             data-eid="chat_history_scroll"
             :items="reversedQueries"
             max-height="70vh"
            >
                <template v-slot:default="{ item }">
                    <div class="pa-1" :class="{highlight : item.id === currentQuery, outline: item.id !== currentQuery }">
                        <div v-if="item.searchType === 'text' || item.searchType === 'temporal'" class="font-weight-bold">{{ item.name }}</div>
                        <img v-if="item.searchType === 'image'" :src="item.name" class="w-50"></img>
                        <div class="text-caption">Time: {{ formatTime(item.timestamp) }}</div>
                        <div class="text-caption">Search Type: {{ item.searchType.toUpperCase() }} | {{ item.searchModel.toUpperCase() }}</div>
                        <div class="text-caption">
                            Filters: 
                            <span v-if="!checkFilters(item.filters)">
                                None
                            </span>
                            <template v-else>
                                <template v-for="(value, tagsetId, index) in item.filters" :key="index">
                                    <span v-if="value.toString() !== ''">
                                        (<i>{{ useFilterStore().filtersInfo.get(props.modelId)!.filter((x) => x.id === Number(tagsetId))[0]?.name }}</i> &mdash; 
                                        {{ value.map((v) => v.value).toString() + ', ' }})
                                    </span>
                                </template>
                            </template>
                        </div>
                        <div class="d-flex align-center ga-2">
                            <v-btn
                             :data-eid="'show_results_btn_' + item.name"
                             text
                             color="primary"
                             size="small"
                             @click="onShowResults(item.id, item.resultIds)"
                            >
                                Show Results
                            </v-btn>
                            <!-- <v-btn
                             :data-eid="'edit_advanced_btn_' + item.name"
                             text
                             :color="item.id === currentQuery ? 'indigo' : 'grey'"
                             size="small"
                             :readonly="item.id !== currentQuery"
                             @click="openAdvancedFromHistory(item)"
                            >
                                <v-icon>mdi-pencil</v-icon>
                            </v-btn> -->
                            <v-checkbox
                                v-bind="props"
                                :data-eid="'temporal_selection_checkbox_' + item.name"
                                v-model="temporalSelection"
                                :value="item"
                                class="d-flex"
                            />
                            <v-tooltip 
                             text="Add to Temporal Search"
                             :open-delay="1000"
                             :close-delay="500"
                            >
                                <template v-slot:activator="{props}">
                                    <v-icon v-bind="props">
                                        mdi-timeline-clock-outline
                                    </v-icon>
                                </template>
                            </v-tooltip>
                        </div>
                    </div>
                </template> 
            </v-virtual-scroll>
        </v-card-text>
        <v-card-actions>
            <v-btn
             v-if="temporalSelection.length > 1"
             data-eid="temporal_dialog_btn"
             color="primary"
             class="ma-2"
             @click="openTemporalDialog"
            >
                Temporal Search ({{ temporalSelection.length }})
            </v-btn>
            <v-btn
             v-if="temporalSelection.length > 1"
             data-eid="clear_temporal_selection_btn"
             color="error"
             class="ma-2"
             @click="temporalSelection = []"
            >
                Clear
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
import { useAdvancedSearchStore } from '@/stores/advancedSearch';
import { ChatQuery } from '@/types/chat';
import { storeToRefs } from 'pinia';
import { AppliedFilters } from '@/types/filter';
import { useFilterStore } from '@/stores/filter';
import { useTemporalSearchStore } from '@/stores/temporalSearchStore';

interface Props {
    modelId: number
}
const props = defineProps<Props>()

const chatStore = useChatStore()
const modelStore = useModelStore()

const inputText = ref<string>('')
const imageVals = reactive({name: '', b64: ''})
const searchType = ref<string>('text')
const searchModel = ref<string>('clip')

const currentModelSession = chatStore.getOrCreateChat(props.modelId)
const currentQuery = computed(() => chatStore.currentQueryId)
const reversedQueries = computed(() => currentModelSession?.slice().reverse())

const advancedStore = useAdvancedSearchStore()
const { performChatSearch, payload } = storeToRefs(advancedStore)

const tempStore = useTemporalSearchStore()
const temporalSelection = ref<ChatQuery[]>([])

const emit = defineEmits<{
    (e: 'show-search-results', resultIds: number[]): void,
}>()


function checkFilters(filters: AppliedFilters) : boolean {
    let hasFilters = false
    if (Object.keys(filters).length > 0) {
        for (const key in filters) {
            if (filters[key].length > 0) {
                hasFilters = true
            }
        }
    }
    return hasFilters
}

function openAdvancedFromBar() {
    advancedStore.open({
        queryName: inputText.value,
        queryText: inputText.value,
        searchType: searchType.value,
        searchModel: searchModel.value,
        filters: {} as AppliedFilters,
        history: false
    })
}

// function openAdvancedFromHistory(item: ChatQuery) {
//     advancedStore.open({
//         queryName: item.name,
//         queryText: item.text,
//         searchType: item.searchType,
//         searchModel: item.searchModel,
//         filters: item.filters,
//         history: true
//     })
// }

function openImageUploadDialog() {
    advancedStore.open({
        queryName: '',
        queryText: inputText.value,
        searchType: 'image',
        searchModel: 'clip',
        filters: {} as AppliedFilters,
        history: false
    })
}

function openTemporalDialog() {
    tempStore.open(temporalSelection.value)
}

watch(() => performChatSearch.value, async (newVal) => {
    if (newVal) {
        if (payload.value.history!) {
            // If we want to have the same number of items when we update filters
            // let qIdx = chatStore.chatSessions.get(modelStore.activeModel!.id)!.findIndex(
            //     (val) => val.id === chatStore.currentQueryId 
            // )
            const resultIds = await chatStore.search(
                modelStore.activeModel!.id,
                payload.value.queryName,
                payload.value.queryText,
                true,
                payload.value.searchType,
                payload.value.searchModel,
                payload.value.filters,
                true,
                // chatStore.chatSessions.get(modelStore.activeModel!.id)![qIdx].resultIds.length
            )
            emit('show-search-results', resultIds)
        } else {
            searchType.value = payload.value.searchType
            if (searchType.value === 'text') {
                inputText.value = payload.value.queryText
            } else if (searchType.value === 'image') {
                imageVals.name = payload.value.queryName
                imageVals.b64 = payload.value.queryText
            }
            searchModel.value = payload.value.searchModel
            search()
        }
        performChatSearch.value = false
        payload.value = {
            queryName: '',
            queryText: '',
            searchType: '',
            searchModel: '',
            filters: [],
            history: false
        }
    }
})

// Show a previously returned set of results
function onShowResults(queryId: string, resultIds: number[]) {
    chatStore.currentQueryId = queryId
    emit('show-search-results', resultIds)
}

function formatTime(ts: number) {
    return new Date(ts).toLocaleString()
}

async function search(refresh=false) {
    if (searchType.value === 'text' && inputText.value === '') return
    let name = inputText.value
    let query = inputText.value
    if (searchType.value === 'image') {
        name = imageVals.name
        query = imageVals.b64
    }
    const resultIds = await chatStore.search(
        modelStore.activeModel!.id, 
        name,
        query, 
        false,
        searchType.value,
        searchModel.value,
        payload.value.filters,
        refresh
    )
    await useItemStore().fetchMediaItems(
        resultIds, 
        props.modelId, 
        modelStore.activeModel!.collection
    )
    imageVals.name = ''
    imageVals.b64 = ''
    inputText.value = ''
    searchType.value = 'text'
    searchModel.value = 'clip'
    emit('show-search-results', resultIds)
}

</script>

<style scoped>
/* Basic styling here */
.highlight {
    border: 4px solid;
    border-radius: 4px;
    border-color: #1565C0;
}
.outline {
    border: 4px solid;
    border-radius: 4px;
    border-color: transparent;
}
</style>
