<template>
    <v-card data-eid="result_grid">
        <v-card-title style="display: flex; align-items: center;">
            Search Results
            <v-switch 
             data-eid="toggle_group_view_btn"
             style="display: flex;" class="pl-4" v-model="groupView" label="Toggle Grouping"
            />
            <div class="feedback-btn-area d-flex">
                <div style="display: flex; align-items: center;" class="pl-3 pr-2">
                    <v-btn data-eid="show_feedback_results_btn" color="primary" @click="onShowFeedbackResults">
                        Show Feedback Results
                    </v-btn>
                    <!-- <v-checkbox label="PRF" v-model="pseudoRF" style="display: flex;"/> -->
                </div>
                <v-btn
                 data-eid="open_advanced_from_rf_btn"
                 color="primary"
                 @click="openAdvancedFromRF"
                 >
                    <v-icon>mdi-filter-outline</v-icon>
                    <v-divider class="border-opacity-0" vertical :thickness="5"/>
                </v-btn>
            </div>
        </v-card-title>
        <v-alert v-if="rfError" type="warning" density="compact" closable class="mx-3 mt-2" @click:close="rfError = ''">
            {{ rfError }}
        </v-alert>
        <h4 class="text-center" v-if="shownIds.length === 0">Results will appear here</h4>
        <v-card-text :key="resultKey">
            <div v-if="!groupView" class="result-items-grid">
                <item
                 v-for="it,itIdx in shownIds"
                 :key="activeModelId+it.toString()+itIdx.toString()"
                 :item-id="it"
                 :item-index="itIdx"
                 :model-id="activeModelId"
                 :btn-pos="true"
                 :btn-neg="true"
                 :btn-ignore="false"
                 :btn-submit="false"
                 :provided="false"
                 :overlay="true"
                 @replace-overlay="updateItem"
                />
            </div>
            <v-container v-else>
                <div v-for="k in groups.keys()" class="pb-5">
                    <v-divider class="border-opacity-75 pb-2"/>
                    <h3 class="pb-2">Group/Video {{ k }}</h3>
                    <v-slide-group
                     show-arrows
                     :data-eid="'slide_group_' + k.toString()"
                    >
                        <v-slide-group-item
                         v-for="it in groups.get(k)?.sort()"
                         :key="k.toString().concat('-', it.toString())"
                        >
                            <div style="width: 180px; flex-shrink: 0;">
                                <item
                                :item-id="it"
                                :item-index="0"
                                :model-id="activeModelId"
                                :btn-pos="true"
                                :btn-neg="true"
                                :btn-ignore="false"
                                :btn-submit="false"
                                :provided="false"
                                :overlay="true"
                                @replace-overlay="updateItem"
                                />
                            </div>
                        </v-slide-group-item>
                    </v-slide-group>
                    <v-divider class="border-opacity-75 pb-2"/>
                </div>
            </v-container>
        </v-card-text>

        <div class="load-more-row">
            <v-btn data-eid="load_more_btn" color="primary" variant="text" @click="onLoadMore">
                Load More
            </v-btn>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useModelStore } from '@/stores/model';
import Item from '@/components/items/Item.vue';
import { useItemStore } from '@/stores/item';
import { useFeedbackStore } from '@/stores/feedback';
import { useChatStore } from '@/stores/chat';
import { useAdvancedSearchStore } from '@/stores/advancedSearch';
import { storeToRefs } from 'pinia';

const modelStore = useModelStore()
const itemStore = useItemStore()
const chatStore = useChatStore()
const advancedStore = useAdvancedSearchStore()

const activeModelId = reactive(computed(() => modelStore.activeModel!.id))

// For controlling the amount shown initially
const itemsPerPage = ref(modelStore.activeModel!.settings.itemsToShow)

const groups: Map<number,number[]> = reactive(new Map<number, number[]>())
const groupView = ref(false)

const pseudoRF = ref(false)

const { performRFSearch } = storeToRefs(advancedStore)

const emit = defineEmits<{
    (e: 'load-more'): void,
    (e: 'selected', itemId: number): void
    (e: 'show-rf-results', resultIds: number[]): void
}>()

const resultKey = ref(0)
const shownIds = computed(() => modelStore.activeModel!.grid[0].items)
const rfError = ref('')

watch(shownIds, () => resultKey.value++)

// Show positive/negative results
async function onShowFeedbackResults() {
    rfError.value = ''
    let suggs: number[] = []
    try {
        if (pseudoRF.value) {
            const qIdx = chatStore.chatSessions.get(activeModelId.value!)!.findIndex(
                (val) => val.id === chatStore.currentQueryId
            )
            suggs = await useFeedbackStore().getFeedbackResults(false, chatStore.chatSessions.get(activeModelId.value)![qIdx].text)
        } else {
            suggs = await useFeedbackStore().getFeedbackResults(false)
        }
        await itemStore.fetchMediaItems(suggs, activeModelId.value, modelStore.getModelCollection(activeModelId.value))
        emit('show-rf-results', suggs)
    } catch (err: any) {
        rfError.value = err?.message ?? 'Feedback search failed'
    }
}

async function getItemGroups() {
    groups.clear()
    await Promise.all(
        shownIds.value.map(async id => {
            const itm = await itemStore.fetchMediaItem(id, activeModelId.value)
            const g = itm.groupId!
            const bucket = groups.get(g) ?? []
            bucket.push(id)
            groups.set(g, bucket)
        })
    )
}

function openAdvancedFromRF() {
    advancedStore.open({
        queryName: 'Feedback',
        queryText: '',
        searchType: 'feedback',
        searchModel: 'clip',
        filters: useFeedbackStore().getRFModelFilters(),
        history: false
    })
}

watch(shownIds, () => {
    getItemGroups()
}, 
{ immediate: true })

watch(() => performRFSearch.value, async (newVal) => {
    if (newVal) {
        const suggs = await useFeedbackStore().getFeedbackResults(false)
        emit('show-rf-results', suggs)
        performRFSearch.value = false
    }
},
{ immediate: true })

async function onLoadMore() {
    emit('load-more')
    itemsPerPage.value += 50 // Or some other logic
}

function updateItem(id: number) {
    emit('selected', id)
}
</script>

<style scoped>
.result-items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 3px;
    max-height: 80vh;
    overflow-y: auto;
    padding: 4px;
}

.load-more-row {
    display: flex;
    justify-content: center;
    padding: 8px 0 4px;
}

.feedback-btn-area {
    float: right;
    margin-left: auto;
}
</style>
