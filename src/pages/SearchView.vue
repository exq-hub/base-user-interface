<template>
    <template v-if="!activeModel"></template>
    <template v-else>
        <model-bar @model-change="updateModel" />

        <left-panel :key="activeModel!.id.toString() + Math.floor(Math.random()*9000)"/>

        <v-container fluid>
            <v-row>
                <!-- 20%: Chat -->
                <v-col cols="2" class="pa-1">
                    <ChatArea 
                     :key="'chatarea'+activeModel!.id+Math.floor(Math.random()*9000)"
                     :model-id="activeModel!.id" 
                     @show-search-results="updateResultIds"
                     @show-urf-results="updateResultIds"
                    />
                </v-col>

                <!-- 50%: Results -->
                <v-col :cols="showMedia ? 6 : 10" class="pa-1">
                    <ResultGrid 
                     :model-id="activeModel!.id"
                     :result-ids="currentResultIds"
                     @selected="updateSelectedItem"
                     @load-more="loadMoreResults"
                    />
                </v-col>

                <!-- 30%: Viewer -->
                <v-col cols="4" class="pa-1" v-if="showMedia">
                    <MediaViewer 
                     :key="'viewer'+modelStore.activeModel!.id+Math.floor(Math.random()*9000)"
                     @selected-segment="updateSelectedItem"
                    />
                </v-col>
            </v-row>
        </v-container>

    </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatArea from '@/components/alternate/ChatArea.vue'
import ResultGrid from '@/components/alternate/ResultGrid.vue'
import MediaViewer from '@/components/alternate/MediaViewer.vue'
import ModelBar from '@/components/model/ModelBar.vue'
import { useModelStore } from '@/stores/model'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useChatStore } from '@/stores/chat'

const modelStore = useModelStore() 
const itemStore = useItemStore()
const chatStore = useChatStore()
const activeModel = computed(() => useModelStore().activeModel)
const showMedia = ref(false)

onMounted(() => {
    if (!activeModel.value) useRouter().push({name: 'home'})
})

const currentResultIds = ref<number[]>([])
const selectedMediaGroupIndex = ref<number | null>(null)
const urf = ref(false)

function updateResultIds(resultIds: number[]) {
    currentResultIds.value = resultIds
    console.log("Current:", currentResultIds.value)
}

async function updateSelectedItem (itemId: number) {
    selectedMediaGroupIndex.value = await itemStore.setSelectedItem(itemId)
    showMedia.value = true
}

function updateModel() {
    console.log('updating model')
    showMedia.value = false
    const chat = useChatStore().getOrCreateChat(activeModel.value!.id)
    if (chat.queries.length > 0) {
        currentResultIds.value = chat.queries.reverse()[0].resultIds
        useChatStore().currentResultsQuery = chat.queries.reverse()[0].text 
    } else {
        currentResultIds.value = []
    }
}

async function loadMoreResults() {
    if (urf.value) {
        // currentResultIds.value = 
    } else {
        currentResultIds.value = await chatStore.search(activeModel.value!.id, chatStore.currentResultsQuery, true)
    }
}

</script>

<style scoped>
</style>