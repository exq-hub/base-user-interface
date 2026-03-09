<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-card :data-eid="eid('root')" class="chat-card">
    <div class="chat-header" :data-eid="eid('header')">
      <div class="text-subtitle-2 font-weight-medium">Search Panel</div>

      <div class="d-flex align-center ga-1">
        <v-tooltip text="Number of past searches in this session" location="top">
          <template #activator="{ props: tipProps }">
            <v-chip v-bind="tipProps" :data-eid="eid('chip_history')" size="small" variant="tonal" label>
              {{ historyItems.length }}
            </v-chip>
          </template>
        </v-tooltip>

        <v-tooltip text="Number of selected temporal searches" location="top">
          <template #activator="{ props: tipProps }">
            <v-chip
              v-bind="tipProps"
              v-if="temporalSelection.length > 0"
              :data-eid="eid('chip_temporal')"
              size="small"
              variant="tonal"
              label
              color="orange"
            >
              T {{ temporalSelection.length }}
            </v-chip>
          </template>
        </v-tooltip>

        <v-chip
         :data-eid="eid('chip_temporal_mode')"
         size="small"
         label
         :color="temporalMode ? 'orange-darken-4' : undefined"
         :variant="temporalMode ? 'flat' : 'tonal'"
         @click="temporalMode = !temporalMode"
        >
          <v-icon start>
            {{ temporalMode ? 'mdi-timeline-check-outline' : 'mdi-timeline-plus-outline' }}
          </v-icon>
          Temporal
        </v-chip>    
      </div>
    </div>

    <v-card-text class="chat-body" :data-eid="eid('body')">
      <SearchBar
        :model-id="modelId"
        v-model="inputText"
        @search="search()"
        @open-filters="openAdvancedFromBar()"
        @open-image="openImageUploadDialog()"
      />
      <v-divider class="my-2" />

      <SearchHistoryList
        :model-id="modelId"
        :items="historyItems"
        :current-query-id="currentQuery"
        :temporal-mode="temporalMode"
        v-model:temporalSelection="temporalSelection"
        @show-results="onShowResults"
        @open-advanced="openAdvancedFromHistory"
      />
    </v-card-text>

    <TemporalSelectionBar
      :model-id="modelId"
      :count="temporalSelection.length"
      @open="openTemporalDialog()"
      @clear="temporalSelection = []"
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import SearchBar from '@/components/search/SearchBar.vue'
import SearchHistoryList from '@/components/search/SearchHistoryList.vue'
import TemporalSelectionBar from '@/components/search/TemporalSelectionBar.vue'

import { useChatStore } from '@/stores/chat'
import { useModelStore } from '@/stores/model'
import { useAdvancedSearchStore } from '@/stores/advancedSearch'
import { useTemporalSearchStore } from '@/stores/temporalSearchStore'

import type { ChatQuery } from '@/types/chat'
import type { AppliedFilters } from '@/types/filter'

const props = defineProps<{ modelId: number }>()

const emit = defineEmits<{
  (e: 'show-search-results', resultIds: number[]): void
}>()

const chatStore = useChatStore()
const modelStore = useModelStore()
const advancedStore = useAdvancedSearchStore()
const tempStore = useTemporalSearchStore()

// data-eid
const eidBase = computed(() => `chat_area_model_${props.modelId}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

// local state (kept as-is)
const inputText = ref<string>('')
const imageVals = reactive({ name: '', b64: '' })
const searchType = ref<string>('text')
const searchModel = ref<string>('clip')

// history
const currentModelSession = chatStore.getOrCreateChat(props.modelId)
const currentQuery = computed(() => chatStore.currentQueryId)
const historyItems = computed(() => (currentModelSession?.slice().reverse() ?? []))

// temporal selection
const temporalMode = ref(false)
const temporalSelection = ref<ChatQuery[]>([])

// dialogs
function openAdvancedFromBar() {
  advancedStore.open({
    queryName: inputText.value,
    queryText: inputText.value,
    searchType: searchType.value,
    searchModel: searchModel.value,
    filters: {} as AppliedFilters,
  })
}

function openAdvancedFromHistory(q: ChatQuery) {
  advancedStore.open({
    queryName: q.name,
    queryText: q.text ?? q.name, 
    searchType: q.searchType,
    searchModel: q.searchModel,
    filters: q.filters,
  } as any)
}

function openImageUploadDialog() {
  advancedStore.open({
    queryName: '',
    queryText: inputText.value,
    searchType: 'image',
    searchModel: 'clip',
    filters: {} as AppliedFilters,
  })
}

function openTemporalDialog() {
  tempStore.open(temporalSelection.value)
}

// show a previous query’s results
function onShowResults(queryId: string, resultIds: number[]) {
  chatStore.currentQueryId = queryId
  emit('show-search-results', resultIds)
}

async function search(refresh = false) {
  if (searchType.value === 'text' && inputText.value.trim() === '') return

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
    {},
    refresh
  )

  // reset
  imageVals.name = ''
  imageVals.b64 = ''
  inputText.value = ''
  searchType.value = 'text'
  searchModel.value = 'clip'

  emit('show-search-results', resultIds)
}

watch(temporalMode, (on) => {
  if (!on) temporalSelection.value = []
})
</script>

<style scoped>
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}

.chat-body {
  flex: 1;
  overflow: hidden;
}
</style>