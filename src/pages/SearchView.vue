<template>
    <template v-if="!activeModel"></template>
    <template v-else>
        <search-dialog/>
        <temporal-search-dialog @show-temporal-results="updateResultIdsTemporal"/>
        <model-bar @model-change="updateModel" />

        <left-panel :key="activeModel!.id.toString() + Math.floor(Math.random()*9000)"/>

        <v-container fluid>
            <v-row>
                <!-- 20%: Chat -->
                <v-col cols="2" class="pa-1">
                    <ChatArea 
                     :key="'chatarea'+activeModel!.id+Math.floor(Math.random()*9000)"
                     :model-id="activeModel!.id" 
                     @show-search-results="updateResultIdsChat"
                    />
                </v-col>

                <!-- 50%: Results -->
                <v-col :cols="showMedia ? 6 : 10" class="pa-1">
                    <ResultGrid 
                     :model-id="activeModel!.id"
                     @selected="updateSelectedItem"
                     @load-more="loadMoreResults"
                     @show-rf-results="updateResultIdsRF"
                    />
                </v-col>

                <!-- 30%: Viewer -->
                <v-col cols="4" class="pa-1" v-if="showMedia">
                    <MediaViewer 
                     :key="'viewer'+modelStore.activeModel!.id+Math.floor(Math.random()*9000)"
                     @close-media-viewer="showMedia = !showMedia"
                    />
                </v-col>
            </v-row>
        </v-container>
    </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatArea from '@/components/search/ChatArea.vue'
import ResultGrid from '@/components/search/ResultGrid.vue'
import MediaViewer from '@/components/viewer/MediaViewer.vue'
import ModelBar from '@/components/model/ModelBar.vue'
import SearchDialog from '@/components/search/SearchDialog.vue';
import TemporalSearchDialog from '@/components/search/TempSearchDialog.vue';
import { useModelStore } from '@/stores/model'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useChatStore } from '@/stores/chat'
import { useFeedbackStore } from '@/stores/feedback'

const modelStore = useModelStore() 
const itemStore = useItemStore()
const chatStore = useChatStore()
const activeModel = computed(() => useModelStore().activeModel)
const showMedia = ref(false)
const feedbackStore = useFeedbackStore()

onMounted(() => {
    if (!activeModel.value) {
        useRouter().push({name: 'home'})
    } 
    // else {
    //     feedbackStore.getOrCreateRF(activeModel.value!.id)
    // }
})

const selectedMediaGroupIndex = ref<number | null>(null)
// const selectedMediaGroup = ref<string | null>(null)
const rf = ref(false)

function updateResultIdsChat(resultIds: number[]) {
    modelStore.activeModel!.grid[0].items = [...resultIds]
    rf.value = false
}

function updateResultIdsRF(resultIds: number[]) {
    modelStore.activeModel!.grid[0].items = [...resultIds]
    rf.value = true
    chatStore.currentQueryId = ''
}

function updateResultIdsTemporal(resultIds: number[]) {
    modelStore.activeModel!.grid[0].items = [...resultIds]
    rf.value = false
}

async function updateSelectedItem (itemId: number) {
    await itemStore.setSelectedItem(itemId)
    const group = itemStore.getSelectedItem().groupId!
    // console.log(itemStore.getSelectedGroup())
    if (selectedMediaGroupIndex.value !== group) {
        selectedMediaGroupIndex.value = group
        showMedia.value = false
    }
    showMedia.value = true
}

function updateModel() {
    console.log('updating model')
    showMedia.value = false
    rf.value = false
    const chat = useChatStore().getOrCreateChat(activeModel.value!.id)
    if (chat.length > 0) {
        modelStore.activeModel!.grid[0].items = chat.slice().reverse()[0].resultIds
        // useChatStore().currentResultsQuery = chat.queries.slice().reverse()[0].text 
    } else {
        modelStore.activeModel!.grid[0].items = []
    }
}

async function loadMoreResults() {
    if (rf.value) {
        modelStore.activeModel!.grid[0].items = [ ...await feedbackStore.getFeedbackResults(true) ]
    } else {
        let qIdx = chatStore.chatSessions.get(activeModel.value!.id)!.findIndex(
            (val) => val.id === chatStore.currentQueryId 
        )
        modelStore.activeModel!.grid[0].items = await chatStore.search(
            activeModel.value!.id, 
            '', 
            '',
            true, 
            '',
            '',
            chatStore.chatSessions.get(activeModel.value!.id)![qIdx].filters,
            false
        )
    }
}

</script>

<style scoped>
</style>