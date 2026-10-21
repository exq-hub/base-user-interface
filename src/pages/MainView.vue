<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <template v-if="!activeModel"></template>
  <template v-else>
    <search-dialog @submit="onAdvancedSubmit"/>
    <temporal-search-dialog @show-temporal-results="updateResultIdsTemporal"/>
    <model-bar @model-change="updateModel" />
    
    <!-- <left-panel :key="activeModel!.id.toString() + Math.floor(Math.random()*9000)"/> -->
    
    <v-container fluid class="main-layout">
      <v-row class="h-100">
        <!-- 20%: Chat -->
        <v-col v-if="chatVisible" :cols="2" class="pa-1 h-100">
          <ChatArea
          :key="'chatarea'+activeModel!.id"
          :model-id="activeModel!.id"
          @show-search-results="updateResultIdsChat"
          />
        </v-col>
        
        <!-- 50%: Results -->
        <v-col :cols="chatVisible ? (showMedia ? 6 : 10) : (showMedia ? 8 : 12)" class="pa-1 h-100">
          <ResultGrid
           :model-id="activeModel!.id"
           :chat-visible="chatVisible"
           @toggle-chat="chatVisible = !chatVisible"
           @selected="updateSelectedItem"
           @load-more="loadMoreResults"
           @show-rf-results="updateResultIdsRF"
           @toggle-positives="posDrawerOpen = !posDrawerOpen"
           @toggle-negatives="negDrawerOpen = !negDrawerOpen"
           @open-positives-dialog="posDialogOpen = true"
           @open-negatives-dialog="negDialogOpen = true"
           @toggle-history="histDialogOpen = !histDrawerOpen"
           @open-history-dialog="histDialogOpen = true"
           @toggle-excluded="excDrawerOpen = !excDrawerOpen"
           @open-excluded-dialog="excDialogOpen = true"
          />
        </v-col>
        
        <!-- 30%: Viewer -->
        <v-col cols="4" class="pa-1 h-100" v-if="showMedia">
          <MediaViewer 
          :key="'viewer'+modelStore.activeModel!.id+Math.floor(Math.random()*9000)"
          @close-media-viewer="showMedia = !showMedia"
          />
        </v-col>
      </v-row>
      <!-- Drawers (persistent) -->
      <SetsDrawer
       v-model="posDrawerOpen"
       :model-id="activeModel!.id"
       :set="ILSets.Positives"
       @popout="posDialogOpen = true"
      />

      <SetsDrawer
       v-model="negDrawerOpen"
       :model-id="activeModel!.id"
       :set="ILSets.Negatives"
       @popout="negDialogOpen = true"
      />

      <SetsDrawer
       v-model="histDrawerOpen"
       :model-id="activeModel!.id"
       :set="ILSets.History"
       @popout="histDialogOpen = true"
      />

      <SetsDrawer
       v-model="excDrawerOpen"
       :model-id="activeModel!.id"
       :set="ILSets.Excluded"
       @popout="excDialogOpen = true"
      />

      <!-- Dialogs (deep inspect) -->
      <SetsDialog
       v-model="posDialogOpen"
       :model-id="activeModel!.id"
       :set="ILSets.Positives"
      />

      <SetsDialog
       v-model="negDialogOpen"
       :model-id="activeModel!.id"
       :set="ILSets.Negatives"
      />
      
      <SetsDialog
       v-model="histDialogOpen"
       :model-id="activeModel!.id"
       :set="ILSets.History"
      />

      <SetsDialog
       v-model="excDialogOpen"
       :model-id="activeModel!.id"
       :set="ILSets.Excluded"
      />
    </v-container>

    <v-snackbar
     v-model="errorStore.visible"
     color="error"
     :timeout="-1"
     location="bottom"
     multi-line
    >
      {{ errorStore.message }}
      <details v-if="errorStore.detail" class="mt-2">
        <summary style="cursor:pointer;opacity:0.8;font-size:0.8rem">Request details</summary>
        <pre style="font-size:0.72rem;white-space:pre-wrap;word-break:break-all;margin-top:4px">{{ errorStore.detail }}</pre>
      </details>
      <template #actions>
        <v-btn variant="text" @click="errorStore.dismiss()">Dismiss</v-btn>
      </template>
    </v-snackbar>

    <v-snackbar
     v-model="submissionStore.visible"
     :color="submissionStore.color"
     :timeout="6000"
     location="top"
     multi-line
    >
      <div class="d-flex align-center ga-3">
        <v-icon :icon="submissionStore.icon" size="32" />
        <div>
          <div class="text-h6 font-weight-bold">{{ submissionStore.title }}</div>
          <div>{{ submissionStore.result?.description }}</div>
          <div v-if="submissionStore.label" class="text-caption" style="opacity:0.8">{{ submissionStore.label }}</div>
        </div>
      </div>
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="submissionStore.dismiss()" />
      </template>
    </v-snackbar>
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
import SetsDrawer from '@/components/sets/SetsDrawer.vue';
import SetsDialog from '@/components/sets/SetsDialog.vue';
import { useModelStore } from '@/stores/model'
import { useRouter } from 'vue-router'
import { useItemStore } from '@/stores/item'
import { useChatStore } from '@/stores/chat'
import { useFeedbackStore } from '@/stores/feedback'
import { useErrorStore } from '@/stores/error'
import { useSubmissionStore } from '@/stores/submission'
import { AdvancedSearchPayload } from '@/types/chat'
import { ILSets } from '@/types/mediaitem'

const modelStore = useModelStore() 
const itemStore = useItemStore()
const chatStore = useChatStore()
const activeModel = computed(() => useModelStore().activeModel)
const showMedia = ref(false)
const feedbackStore = useFeedbackStore()
const errorStore = useErrorStore()
const submissionStore = useSubmissionStore()
const chatVisible = ref(true)
const posDrawerOpen = ref(false)
const negDrawerOpen = ref(false)
const posDialogOpen = ref(false)
const negDialogOpen = ref(false)
const histDrawerOpen = ref(false)
const histDialogOpen = ref(false)
const excDrawerOpen = ref(false)
const excDialogOpen = ref(false)

onMounted(() => {
  if (!activeModel.value) {
    useRouter().push({name: 'home'})
  } 
  // else {
  //     feedbackStore.getOrCreateRF(activeModel.value!.id)
  // }
})

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
  // The item is selected right away and its video loads in the background.
  // Open the panel now so it doesn't look like the page is hanging.
  const loading = itemStore.setSelectedItem(itemId)
  showMedia.value = true
  // Awaited so load errors still reach the global error handler
  await loading
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
    const qIdx = chatStore.chatSessions.get(activeModel.value!.id)!.findIndex(
      (val) => val.id === chatStore.currentQueryId
    )
    modelStore.activeModel!.grid[0].items = await chatStore.search(
      activeModel.value!.id,
      '', '',
      true, '', '',
      chatStore.chatSessions.get(activeModel.value!.id)![qIdx].filters,
      false
    )
  }
}

async function onAdvancedSubmit(p: AdvancedSearchPayload) {
  const modelId = activeModel.value!.id
  const collection = modelStore.getModelCollection(modelId)

  // FEEDBACK SEARCH
  if (p.searchType === 'feedback') {
    feedbackStore.setRFModelFilters(p.filters)
    const ids = await feedbackStore.getFeedbackResults(false)
    updateResultIdsRF(ids)
    return
  }

  // NORMAL SEARCH (text / image / temporal)
  const ids = await chatStore.search(
    modelId,
    p.queryName,
    p.queryText,
    false,
    p.searchType,
    p.searchModel,
    p.filters,
    false
  )

  await itemStore.fetchMediaItems(ids, modelId, collection)

  updateResultIdsChat(ids)
}
  
</script>

<style scoped>
/* The panels fill the screen below the app bar and scroll inside instead of the page */
.main-layout {
  height: calc(100dvh - var(--v-layout-top, 0px));
}
</style>