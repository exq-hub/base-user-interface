<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<template>
  <v-card data-eid="result_grid" class="result-card">
    <v-card-title class="result-header">
      <v-tooltip 
       :text="props.chatVisible ? 'Hide search panel' : 'Show search panel'"
       :open-delay="1000"
       location="bottom"
      >
        <template #activator="{ props: tipProps }">
          <v-btn
            v-bind="tipProps"
            data-eid="result_grid_toggle_chat"
            icon
            size="small"
            variant="text"
            @click="emit('toggle-chat')"
          >
            <v-icon>
              {{ props.chatVisible ? 'mdi-chevron-left' : 'mdi-magnify' }}
            </v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <div class="d-flex align-center ga-4 flex-wrap">
        <span class="text-h6">Search Results</span>

        <v-switch
          data-eid="toggle_group_view_btn"
          v-model="groupView"
          label="Group by Video"
          hide-details
          density="compact"
        />
      </div>

      <div class="feedback-btn-area d-flex align-center ga-2">
        <v-tooltip v-if="historyEnabled" text="Inspect history" location="bottom">
          <template #activator="{ props: tipProps }">
            <v-badge :content="histCount" :model-value="histCount > 0" :color="'white'">
              <v-btn
               v-bind="tipProps"
               data-eid="result_grid_btn_history"
               icon
               size="small"
               variant="text"
               @click="onHistClick"
               :color="(histCount > 0) ? 'white' : 'grey'"
              >
                <v-icon>mdi-eye-off-outline</v-icon>
              </v-btn>
            </v-badge>
          </template>
        </v-tooltip>
        <v-tooltip text="Inspect excluded" location="bottom">
          <template #activator="{ props: tipProps }">
            <v-badge :content="excCount" :model-value="excCount > 0" :color="'warning'">
              <v-btn
               v-bind="tipProps"
               data-eid="result_grid_btn_excluded"
               icon
               size="small"
               variant="text"
               @click="onExcClick"
               :color="(excCount > 0) ? 'warning' : 'grey'"
              >
                <v-icon>mdi-cancel</v-icon>
              </v-btn>
            </v-badge>
          </template>
        </v-tooltip>
        <v-tooltip text="Inspect positives" location="bottom">
          <template #activator="{ props: tipProps }">
            <v-badge :content="posCount" :model-value="posCount > 0" color="success">
              <v-btn
               v-bind="tipProps"
               data-eid="result_grid_btn_positives"
               icon
               size="small"
               variant="text"
               @click="onPosClick"
               :color="(posCount > 0) ? 'success' : 'grey'"
              >
                <v-icon>mdi-thumb-up-outline</v-icon>
              </v-btn>
            </v-badge>
          </template>
        </v-tooltip>

        <v-tooltip text="Inspect negatives" location="bottom">
          <template #activator="{ props: tipProps }">
            <v-badge :content="negCount" :model-value="negCount > 0" color="error">
              <v-btn
               v-bind="tipProps"
               data-eid="result_grid_btn_negatives"
               icon
               size="small"
               variant="text"
               @click="onNegClick"
               :color="(negCount > 0) ? 'error' : 'grey'"
              >
                <v-icon>mdi-thumb-down-outline</v-icon>
              </v-btn>
            </v-badge>
          </template>
        </v-tooltip>
        
        <v-btn data-eid="show_feedback_results_btn" color="primary" @click="onShowFeedbackResults">
          Show Feedback Results
        </v-btn>

        <v-btn data-eid="open_advanced_from_rf_btn" color="primary" @click="openAdvancedFromRF" icon>
          <v-icon>mdi-filter-outline</v-icon>
        </v-btn>
      </div>
    </v-card-title>

    <v-divider />

    <v-card-text class="result-body">
      <div v-if="shownIds.length === 0" class="empty-state">
        Results will appear here
      </div>

      <!-- Normal grid view -->
      <div v-else-if="!groupView" class="result-grid" :style="gridStyle">
        <ItemTile
          v-for="id in shownIds"
          :key="`${activeModelId}-${id}`"
          :item-id="id"
          :model-id="activeModelId"
          :item="itemsById.get(id) ?? null"
          :group-info="getGroupInfoForItem(id)"
          :tile-width="tileWidth"
          :aspect-ratio="aspectRatio"
          :btn-pos="true"
          :btn-neg="true"
          :btn-ignore="false"
          :btn-submit="true"
          :history-enabled="historyEnabled"
          :show-remove="true"
          :remove-set="removeSet(id)"
          :enable-hover-preview="true"
          @open="onOpen"
          @add="onAdd"
          @remove="onRemove"
        />
      </div>

      <!-- Group-by-video view, temporal results show each video's chains side by side in its row -->
      <div v-else class="group-view">
        <div v-for="block in groupBlocks" :key="block.key" class="group-block">
          <div class="d-flex align-center ga-2 mb-2">
            <v-divider class="flex-grow-1" />
            <div class="text-subtitle-1 font-weight-medium text-no-wrap flex-shrink-0">{{ block.label }}</div>
            <v-divider class="flex-grow-1" />
          </div>

          <v-slide-group show-arrows :data-eid="`slide_group_${block.key}`">
            <div
              v-for="seg in block.segments"
              :key="seg.key"
              :data-eid="`segment_${seg.key}`"
              class="segment"
            >
              <div v-if="seg.label" class="segment-label text-caption font-weight-medium">{{ seg.label }}</div>
              <div class="d-flex">
                <div
                  v-for="id in seg.ids"
                  :key="`${activeModelId}-${seg.key}-${id}`"
                  class="slide-tile"
                  :style="slideTileStyle"
                >
                  <ItemTile
                    :item-id="id"
                    :model-id="activeModelId"
                    :item="itemsById.get(id) ?? null"
                    :group-info="getGroupInfoForItem(id)"
                    :tile-width="tileWidth"
                    :aspect-ratio="aspectRatio"
                    :btn-pos="true"
                    :btn-neg="true"
                    :btn-ignore="false"
                    :btn-submit="true"
                    :history-enabled="historyEnabled"
                    :show-remove="true"
                    :remove-set="removeSet(id)"
                    :enable-hover-preview="true"
                    @open="onOpen"
                    @add="onAdd"
                    @remove="onRemove"
                  />
                </div>
              </div>
            </div>
          </v-slide-group>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="result-actions">
      <v-btn
       data-eid="load_more_btn"
       color="primary"
       :disabled="currentQuery?.searchType === 'temporal' && !hasMoreTemporal"
       @click="onLoadMore"
      >
        Load More
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ItemTile from '@/components/items/ItemTile.vue'
import { useModelStore } from '@/stores/model'
import { useItemStore } from '@/stores/item'
import { useGroupStore } from '@/stores/group'
import { useFeedbackStore } from '@/stores/feedback'
import { useChatStore } from '@/stores/chat'
import { useAdvancedSearchStore } from '@/stores/advancedSearch'
import { ILSets } from '@/types/mediaitem'
import type MediaItem from '@/types/mediaitem'
import type { GroupMetadata } from '@/types/mediaitem'
import type { ExqTemporalChain } from '@/types/exq'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  modelId: number,
  chatVisible?: boolean
}>()

const modelStore = useModelStore()
const itemStore = useItemStore()
const groupStore = useGroupStore()
const feedbackStore = useFeedbackStore()
const chatStore = useChatStore()
const advancedStore = useAdvancedSearchStore()

const activeModelId = computed(() => modelStore.activeModel!.id)
const collection = computed(() => modelStore.getModelCollection(activeModelId.value))

const groupView = ref(false)
const pseudoRF = ref(false)

const historyEnabled = computed(() => modelStore.activeModel!.settings.historyEnabled)

function removeSet(id: number) {
  if (itemStore.isItemInPos(id, props.modelId)) return ILSets.Positives
  if (itemStore.isItemInNeg(id, props.modelId)) return ILSets.Negatives
  if (itemStore.isItemInHistory(id, props.modelId)) return ILSets.History
  return null
}

const emit = defineEmits<{
  (e: 'toggle-chat'): void
  (e: 'load-more'): void
  (e: 'selected', itemId: number): void
  (e: 'show-rf-results', resultIds: number[]): void
  (e: 'toggle-positives'): void
  (e: 'toggle-negatives'): void
  (e: 'toggle-history'): void
  (e: 'toggle-excluded'): void
  (e: 'open-positives-dialog'): void
  (e: 'open-negatives-dialog'): void
  (e: 'open-history-dialog'): void
  (e: 'open-excluded-dialog'): void
}>()

const gridIds = computed(() => modelStore.activeModel!.grid[0].items)

// Tile sizing
const tileWidth = computed(() => useAppStore().globalThumbSize)
const aspectRatio = 16 / 9

const gridStyle = computed(() => ({
  '--tile-w': `${tileWidth.value}px`
}))

const slideTileStyle = computed(() => ({
  width: `${tileWidth.value}px`
}))

// Counts for feedback results
const posCount = computed(() =>
  itemStore.getSetItems(activeModelId.value, ILSets.Positives).length
)
const negCount = computed(() =>
  itemStore.getSetItems(activeModelId.value, ILSets.Negatives).length
)
const histCount = computed(() =>
  itemStore.getSetItems(activeModelId.value, ILSets.History).length
)
const excCount = computed(() =>
  itemStore.getSetItems(activeModelId.value, ILSets.Excluded).length
)

function onPosClick(e: MouseEvent) {
  if (e.shiftKey) emit('open-positives-dialog')
  else emit('toggle-positives')
}

function onNegClick(e: MouseEvent) {
  if (e.shiftKey) emit('open-negatives-dialog')
  else emit('toggle-negatives')
}

function onHistClick(e: MouseEvent) {
  if (e.shiftKey) emit('open-history-dialog')
  else emit('toggle-history')
}

function onExcClick(e: MouseEvent) {
  if (e.shiftKey) emit('open-excluded-dialog')
  else emit('toggle-excluded')
}

// Prefetched items (id -> MediaItem)
const itemsById: Map<number, MediaItem> = reactive(new Map())

// Grouping (groupId -> ids)
const groups: Map<number, number[]> = reactive(new Map())

const groupOrder = computed(() => {
  const keys = Array.from(groups.keys())
  keys.sort((a, b) => {
    if (a === -1 && b !== -1) return 1
    if (b === -1 && a !== -1) return -1
    return a - b
  })
  return keys
})

function getGroupInfoForItem(id: number): GroupMetadata | null {
  const it = itemsById.get(id)
  if (!it || it.groupId == null) return null
  return groupStore.get(collection.value, it.groupId) // NOTE: groupStore cache is keyed by collection+groupId
}

// All items of a group share the key, so the first one is enough
function groupLabel(groupId: number): string | number {
  const first = groups.get(groupId)?.[0]
  return (first != null && itemsById.get(first)?.groupKey) || groupId
}

const currentQuery = computed(() =>
  chatStore.chatSessions.get(activeModelId.value)?.find((q) => q.id === chatStore.currentQueryId)
)

// Temporal results arrive all at once, Load More reveals a page of videos at a time so only those are fetched and rendered
const TEMPORAL_PAGE_SIZE = 20
const temporalVideosShown = ref(TEMPORAL_PAGE_SIZE)

// The server orders videos by their best chain, the map keeps that order
const temporalVideos = computed(() => {
  const chains = currentQuery.value?.chains
  if (!chains) return null
  const byVideo = new Map<number, ExqTemporalChain[]>()
  for (const c of chains) {
    const bucket = byVideo.get(c.group) ?? []
    bucket.push(c)
    byVideo.set(c.group, bucket)
  }
  return Array.from(byVideo, ([group, videoChains]) => ({ group, chains: videoChains }))
})

const shownTemporalVideos = computed(() => temporalVideos.value?.slice(0, temporalVideosShown.value) ?? null)
const hasMoreTemporal = computed(() => (temporalVideos.value?.length ?? 0) > temporalVideosShown.value)

const shownIds = computed(() => {
  const videos = shownTemporalVideos.value
  if (!videos) return gridIds.value
  return [...new Set(videos.flatMap(v => v.chains.flatMap(c => c.items)))]
})

// Temporal results open in the chain view and the earlier setting comes back for other searches
let groupViewBefore: boolean | null = null
watch(
  () => currentQuery.value?.id,
  () => {
    temporalVideosShown.value = TEMPORAL_PAGE_SIZE
    if (currentQuery.value?.searchType === 'temporal') {
      if (groupViewBefore === null) groupViewBefore = groupView.value
      groupView.value = true
    } else if (groupViewBefore !== null) {
      groupView.value = groupViewBefore
      groupViewBefore = null
    }
  }
)

// m:ss below an hour and h:mm:ss from there on
function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

// Temporal results get a segment per chain in their video's block, other results one unlabelled segment per video
const groupBlocks = computed(() => {
  const videos = shownTemporalVideos.value
  if (videos) {
    return videos.map(({ group, chains: videoChains }) => ({
      key: `video_${group}`,
      label: `Video ${itemsById.get(videoChains[0].items[0])?.groupKey || group}`,
      segments: videoChains.map((c, i) => ({
        key: `chain_${group}_${i}`,
        label: `${formatMs(c.start_ms)}–${formatMs(c.end_ms)}`,
        ids: c.items,
      })),
    }))
  }
  return groupOrder.value.map((groupId) => ({
    key: String(groupId),
    label: `Video ${groupLabel(groupId)}`,
    segments: [{ key: String(groupId), label: null, ids: groups.get(groupId) ?? [] }],
  }))
})

async function prefetchShownItems(ids: number[]) {
  const keep = new Set(ids)
  for (const id of Array.from(itemsById.keys())) {
    if (!keep.has(id)) itemsById.delete(id)
  }

  const missing = ids.filter((id) => !itemsById.has(id))
  if (missing.length === 0) return

  // One batch request for all of them, ids the collection doesn't have are left out
  const fetched = await itemStore.fetchMediaItems(missing, activeModelId.value, collection.value)
  for (const it of fetched) itemsById.set(it.id, it)
}

/**
 * Prefetch GroupMetadata for all groupIds in the currently shown items, in one batch request.
 */
async function prefetchGroupsFromItems(ids: number[]) {
  const groupIds: number[] = []
  for (const id of ids) {
    const it = itemsById.get(id)
    if (it?.groupId != null) groupIds.push(it.groupId)
  }
  await groupStore.fetchGroupsInfo(collection.value, groupIds, activeModelId.value)
}

function rebuildGroups(ids: number[]) {
  groups.clear()
  for (const id of ids) {
    const it = itemsById.get(id)
    const g = it?.groupId ?? -1
    const bucket = groups.get(g) ?? []
    bucket.push(id)
    groups.set(g, bucket)
  }
}

/**
 * Ensure correctness when shownIds changes rapidly:
 * - Use a monotonically increasing sequence number.
 * - Only apply results if the sequence matches the latest.
 */
let seq = 0
watch(
  shownIds,
  async (ids) => {
    const mySeq = ++seq

    // Prefetch items (await)
    await prefetchShownItems(ids)
    if (mySeq !== seq) return

    // Prefetch groups (await)
    await prefetchGroupsFromItems(ids)
    if (mySeq !== seq) return

    // Build grouping map
    rebuildGroups(ids)
  },
  { immediate: true }
)

// Show positive/negative results
async function onShowFeedbackResults() {
  let suggs: number[] = []
  if (pseudoRF.value) {
    const session = chatStore.chatSessions.get(activeModelId.value!)!
    const qIdx = session.findIndex((val) => val.id === chatStore.currentQueryId)
    suggs = await feedbackStore.getFeedbackResults(false, session[qIdx]?.text ?? '')
  } else {
    suggs = await feedbackStore.getFeedbackResults(false)
  }
  emit('show-rf-results', suggs)
}

function openAdvancedFromRF() {
  advancedStore.open({
    queryName: 'Feedback',
    queryText: '',
    searchType: 'feedback',
    searchModel: 'clip',
    filters: feedbackStore.getRFModelFilters(),
    history: false
  })
}

// Temporal pages come from the chains already loaded, other searches ask the server for more
function onLoadMore() {
  if (currentQuery.value?.searchType === 'temporal') {
    temporalVideosShown.value += TEMPORAL_PAGE_SIZE
    return
  }
  emit('load-more')
}

function onOpen(itemId: number) {
  emit('selected', itemId)
}

function onAdd(payload: { itemId: number; set: ILSets }) {
  itemStore.addItemToSet(payload.itemId, activeModelId.value, payload.set)
}

function onRemove(payload: { itemId: number; set: ILSets }) {
  itemStore.removeItemFromSet(payload.itemId, activeModelId.value, payload.set)
}
</script>

<style scoped>
.result-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feedback-btn-area {
  margin-left: auto;
}

/* Takes the height between the header and Load More, on very short screens the body scrolls */
.result-body {
  padding: 8px;
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.empty-state {
  padding: 24px 8px;
  text-align: center;
  opacity: 0.7;
}

/* grid */
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--tile-w), 1fr));
  gap: 8px;
  /* Rows keep the tile height, auto rows would shrink to fit the fixed grid height */
  grid-auto-rows: max-content;
  flex: 1 1 0;
  min-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

/* group view */
.group-view {
  flex: 1 1 0;
  min-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.group-block {
  padding-bottom: 16px;
}

.slide-tile {
  margin-right: 8px;
}

/* Later chains of a video get a divider on their left */
.segment + .segment {
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  padding-left: 8px;
}

.segment-label {
  margin-bottom: 4px;
  opacity: 0.8;
  white-space: nowrap;
}

.result-actions {
  justify-content: flex-start;
}
</style>