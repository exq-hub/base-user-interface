<template>
    <template v-if="activeModelId === -1"></template>
    <template v-else>
        <model-bar />

        <left-panel />

        <v-container fluid>
            <v-row>
                <!-- 20%: Chat -->
                <v-col class="border-right">
                    <ChatArea 
                     :model-id="activeModelId" 
                     @show-search-results="updateResultIds"
                     @show-urf-results="console.log('Fetch URF results')"
                    />
                </v-col>

                <!-- 50%: Results -->
                <v-col cols="9" class="border-right">
                    <ResultGrid 
                     :model-id="activeModelId"
                     :result-ids="currentResultIds"
                     @selected="updateSelectedItem"
                    />
                </v-col>

                <!-- 30%: Viewer -->
                <v-col cols="4" v-if="selectedMediaId">
                    <MediaViewer :mediaId="selectedMediaId" />
                </v-col>
            </v-row>
        </v-container>

        <right-panel />
    </template>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatArea from '@/components/alternate/ChatArea.vue'
import ResultGrid from '@/components/alternate/ResultGrid.vue'
import MediaViewer from '@/components/alternate/MediaViewer.vue'
import ModelBar from '@/components/model/ModelBar.vue'
import RightPanel from '@/components/model/RightPanel.vue';
import { useModelStore } from '@/stores/model'
import { useRouter } from 'vue-router'

const modelStore = useModelStore() 

const activeModelId = ref(-1)

onMounted(() => {
    if (!modelStore.activeModel) useRouter().push({name: 'home'})
})

if (!modelStore.activeModel)
    activeModelId.value = -1
else
    activeModelId.value = modelStore.activeModel.id

const currentResultIds = ref<number[]>([])
const selectedMediaId = ref<number | null>(null)

function updateResultIds(resultIds: number[]) {
    currentResultIds.value = resultIds
    console.log("Current:", currentResultIds.value)
}

function updateSelectedItem (id: number) {
    selectedMediaId.value = id
}

// You'd typically receive these from a store or from events emitted by ChatArea/ResultGrid.
</script>

<style scoped>
</style>