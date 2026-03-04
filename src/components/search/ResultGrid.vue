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
          :btn-submit="false"
          :enable-hover-preview="true"
          @open="onOpen"
          @add="onAdd"
          @remove="onRemove"
        />
      </div>

      <!-- Group-by-video view -->
      <div v-else class="group-view">
        <div v-for="groupId in groupOrder" :key="groupId" class="group-block">
          <div class="d-flex align-center ga-2 mb-2">
            <v-divider class="flex-grow-1" />
            <div class="text-subtitle-1 font-weight-medium">Video {{ groupId }}</div>
            <v-divider class="flex-grow-1" />
          </div>

          <v-slide-group show-arrows :data-eid="`slide_group_${groupId}`">
            <v-slide-group-item
              v-for="id in (groups.get(groupId) ?? [])"
              :key="`${activeModelId}-${groupId}-${id}`"
            >
              <div class="slide-tile" :style="slideTileStyle">
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
                  :btn-submit="false"
                  :enable-hover-preview="true"
                  @open="onOpen"
                  @add="onAdd"
                  @remove="onRemove"
                />
              </div>
            </v-slide-group-item>
          </v-slide-group>
        </div>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="result-actions">
      <v-btn data-eid="load_more_btn" color="primary" @click="onLoadMore">
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

const emit = defineEmits<{
  (e: 'toggle-chat'): void
  (e: 'load-more'): void
  (e: 'selected', itemId: number): void
  (e: 'show-rf-results', resultIds: number[]): void
  (e: 'toggle-positives'): void
  (e: 'toggle-negatives'): void
  (e: 'open-positives-dialog'): void
  (e: 'open-negatives-dialog'): void
}>()

const shownIds = computed(() => modelStore.activeModel!.grid[0].items)

// Tile sizing
const tileWidth = computed(() => modelStore.getThumbnailSize(activeModelId.value) || 220)
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

function onPosClick(e: MouseEvent) {
  if (e.shiftKey) emit('open-positives-dialog')
  else emit('toggle-positives')
}

function onNegClick(e: MouseEvent) {
  if (e.shiftKey) emit('open-negatives-dialog')
  else emit('toggle-negatives')
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

async function prefetchShownItems(ids: number[]) {
  const keep = new Set(ids)
  for (const id of Array.from(itemsById.keys())) {
    if (!keep.has(id)) itemsById.delete(id)
  }

  const missing = ids.filter((id) => !itemsById.has(id))
  if (missing.length === 0) return

  const fetched = await Promise.all(missing.map((id) => itemStore.fetchMediaItem(id, activeModelId.value)))
  for (const it of fetched) itemsById.set(it.id, it)
}

/**
 * Prefetch GroupMetadata for all groupIds in the currently shown items.
 *
 * IMPORTANT FUTURE UPDATE (batch GroupMetadata):
 * groupStore.fetchGroupsInfo has a TODO to replace Promise.all with ONE API call when added.
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

function onLoadMore() {
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
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feedback-btn-area {
  margin-left: auto;
}

.result-body {
  padding: 8px;
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
  max-height: 80vh;
  overflow-y: auto;
  padding: 4px;
}

/* group view */
.group-view {
  max-height: 80vh;
  overflow-y: auto;
  padding: 4px;
}

.group-block {
  padding-bottom: 16px;
}

.slide-tile {
  margin-right: 8px;
}

.result-actions {
  justify-content: flex-start;
}
</style>