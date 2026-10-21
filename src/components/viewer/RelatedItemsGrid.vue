<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <div :data-eid="eid('root')" class="related-root">
    <!-- Header -->
    <div class="related-header" :data-eid="eid('header')">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-2 font-weight-bold">Related</div>
        <v-progress-circular
         v-if="loading"
         :data-eid="eid('count_loading')"
         indeterminate
         size="14"
         width="2"
        />
        <v-chip v-else :data-eid="eid('count')" size="x-small" label variant="outlined">
          {{ allIds.length }}
        </v-chip>
      </div>

      <div class="d-flex align-center justify-end flex-grow-1 ga-2 ml-2">
        <slot name="search" />

        <v-btn
         :data-eid="eid('btn_open_dialog')"
         variant="outlined"
         size="small"
         @click="dialogOpen = true"
         :disabled="allIds.length === 0"
        >
          Open
        </v-btn>
      </div>
    </div>

    <!-- Density slider (capped at 100) -->
    <div class="related-controls" :data-eid="eid('controls')">
      <div class="text-caption opacity-70">Summary</div>
      <v-slider
       v-model="summaryCount"
       :data-eid="eid('slider_summary')"
       :min="20"
       :max="summaryMax"
       :step="5"
       :disabled="isSearching"
       hide-details
       thumb-label
       density="compact"
       color="indigo"
      />
    </div>

    <!-- Vertical preview grid (3 columns, scroll; slider caps at 100) -->
    <div
      class="preview-wrap"
      :data-eid="eid('preview_wrap')"
      v-if="displayedIds.length > 0"
    >
      <div class="preview-grid" :data-eid="eid('preview_grid')">
        <div
         v-for="id in displayedIds"
         :key="id"
         class="preview-cell"
         :class="{ 'preview-cell--selected': id === selectedId }"
         :data-eid="eid(`preview_cell_${id}`)"
        >
          <ItemTile
           :data-eid="eid(`itemtile_${id}`)"
           :item-id="id"
           :model-id="modelId"
           :item="itemFor(id)"
           :group-info="null"
           :tile-width="tileWidth"
           :aspect-ratio="aspectRatio"
           :btn-pos="true"
           :btn-neg="true"
           :btn-submit="true"
           :show-remove="true"
           :remove-set="itemStore.isItemInPos(id, props.modelId) ? ILSets.Positives : itemStore.isItemInNeg(id, props.modelId) ? ILSets.Negatives : null"
           :history-enabled="false"
           :enable-hover-preview="false"
           @open="onSelect(id)"
           @add="onAdd"
           @remove="onRemove"
          />
        </div>
      </div>

      <!-- Keyed so it's observed again after each page, in case it's still in view -->
      <div
       v-if="hasMoreResults"
       :key="shownCount"
       v-intersect="loadMore"
       class="results-sentinel"
       :data-eid="eid('results_sentinel')"
      >
        <v-progress-circular indeterminate size="18" width="2" color="indigo" />
      </div>
    </div>

    <div v-else-if="loading" class="related-loading" :data-eid="eid('loading')">
      <v-progress-circular indeterminate color="indigo" />
    </div>

    <div v-else class="empty" :data-eid="eid('empty')">
      {{ isSearching ? 'No matches in this video.' : 'No related items.' }}
    </div>

    <!-- Dialog for dense/all view -->
    <v-dialog v-model="dialogOpen" max-width="1200" scrollable :data-eid="eid('dialog')">
      <v-card rounded="lg" :data-eid="eid('dialog_card')">
        <v-card-title class="d-flex align-center justify-space-between" :data-eid="eid('dialog_header')">
          <div class="d-flex align-center ga-2">
            <div class="text-subtitle-1 font-weight-bold">Related items</div>
            <v-chip size="x-small" label variant="outlined" :data-eid="eid('dialog_count')">
              {{ allIds.length }}
            </v-chip>
          </div>

          <div class="d-flex align-center ga-2">
            <v-btn
             :data-eid="eid('dialog_btn_close')"
             icon
             variant="text"
             @click="dialogOpen = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text class="dialog-body" :data-eid="eid('dialog_body')">
          <div class="dialog-controls" :data-eid="eid('dialog_controls')">
            <div class="text-caption opacity-70">Density</div>

            <div class="d-flex align-center ga-3">
              <v-slider
               v-model="dialogCount"
               :data-eid="eid('dialog_slider')"
               :min="Math.min(100, allIds.length || 100)"
               :max="Math.max(100, allIds.length || 100)"
               :step="10"
               hide-details
               thumb-label="always"
               density="compact"
               :disabled="allIds.length <= 100"
              />

              <v-checkbox
               v-model="dialogAll"
               :data-eid="eid('dialog_all_toggle')"
               hide-details
               density="compact"
               label="All"
               :disabled="allIds.length <= 100"
              />
            </div>

            <div class="text-caption opacity-70">
              Showing: {{ dialogVisibleCount }} / {{ allIds.length }}
            </div>
          </div>

          <!-- Virtualized rows of tiles -->
          <v-virtual-scroll
           :data-eid="eid('dialog_virtual')"
           :items="dialogRows"
           :item-height="dialogRowHeight"
           height="70vh"
          >
            <template #default="{ item: row, index }">
              <div
               v-intersect="(visible: boolean) => visible && ensureLoaded(row)"
               class="dialog-row"
               :data-eid="eid(`dialog_row_${index}`)"
              >
                <div class="dialog-row-grid">
                  <div
                   v-for="id in row"
                   :key="id"
                   class="dialog-cell"
                   :class="{ 'dialog-cell--selected': id === selectedId }"
                   :data-eid="eid(`dialog_cell_${id}`)"
                  >
                    <ItemTile
                     :data-eid="eid(`dialog_itemtile_${id}`)"
                     :item-id="id"
                     :model-id="modelId"
                     :item="itemFor(id)"
                     :group-info="null"
                     :tile-width="dialogTileWidth"
                     :aspect-ratio="aspectRatio"
                     :btn-pos="true"
                     :btn-neg="true"
                     :btn-submit="true"
                     :show-remove="true"
                     :remove-set="itemStore.isItemInPos(id, props.modelId) ? ILSets.Positives : itemStore.isItemInNeg(id, props.modelId) ? ILSets.Negatives : null"
                     :history-enabled="false"
                     :enable-hover-preview="false"
                     @open="onSelect(id)"
                     @add="onAdd"
                     @remove="onRemove"
                    />
                  </div>
                </div>
              </div>
            </template>
          </v-virtual-scroll>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-4 py-3" :data-eid="eid('dialog_actions')">
          <v-spacer />
          <v-btn :data-eid="eid('dialog_btn_close_bottom')" variant="outlined" @click="dialogOpen = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ItemTile from '@/components/items/ItemTile.vue'
import { useItemStore } from '@/stores/item'
import { useModelStore } from '@/stores/model'
import { useErrorStore } from '@/stores/error'
import type MediaItem from '@/types/mediaitem'
import { ILSets } from '@/types/mediaitem'

const props = defineProps<{
  modelId: number
  mediaItem: MediaItem
  relatedItems: number[]          // ids
  loading?: boolean               // related IDs still being fetched
  searchResults?: number[] | null // in-video search results in ranked order, null when not searching
}>()

const emit = defineEmits<{
  (e: 'select-item', itemId: number): void
}>()

const itemStore = useItemStore()
const modelStore = useModelStore()

const eidBase = computed(() => `related_grid_model_${props.modelId}_item_${props.mediaItem?.id ?? 'none'}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const collection = computed(() => modelStore.getModelCollection(props.modelId))

const dialogOpen = ref(false)

const summaryMax = 100
// Start at the minimum because long videos have 1000+ shots and every tile costs requests
const summaryCount = ref(20)

const dialogAll = ref(false)
const dialogCount = ref(200)

const tileWidth = 170
const dialogTileWidth = 200
const aspectRatio = 16 / 9

// Related IDs arrive from the server already in time order (sorted by Start/Keyframe ms)
const allIds = computed(() => props.relatedItems)

// Items come from the store cache and are null until loaded (the tile shows a skeleton)
function itemFor(id: number): MediaItem | null {
  return itemStore.items.get(collection.value)?.get(id) ?? null
}

// One controller per video. Switching video (or closing the viewer) cancels
// everything still queued or running for the old one
let loadCtrl = new AbortController()

watch(allIds, () => {
  loadCtrl.abort()
  loadCtrl = new AbortController()
})

onBeforeUnmount(() => loadCtrl.abort())

// Fetches base info for IDs not cached yet. The store dedupes and caps concurrency
function ensureLoaded(ids: number[]) {
  if (ids.length === 0) return
  itemStore.fetchMediaItems(ids, props.modelId, collection.value, loadCtrl.signal)
    .catch((err) => {
      if (err?.name !== 'AbortError') useErrorStore().show(err)
    })
}

function onAdd(payload: { itemId: number; set: ILSets }) {
  itemStore.addItemToSet(payload.itemId, props.modelId, payload.set)
}

function onRemove(payload: { itemId: number; set: ILSets }) {
  itemStore.removeItemFromSet(payload.itemId, props.modelId, payload.set)
}

const selectedId = computed(() => props.mediaItem?.id ?? -1)

// --- Summary sampling (cap 100) ---

// k evenly spaced indices over 0..n-1, always including both ends
function sampleIndices(n: number, k: number): number[] {
  if (n === 0 || k <= 0) return []
  if (k >= n) return Array.from({ length: n }, (_, i) => i)
  if (k === 1) return [Math.floor((n - 1) / 2)]

  const idxs = new Set<number>()
  for (let i = 0; i < k; i++) {
    idxs.add(Math.round((i * (n - 1)) / (k - 1)))
  }
  return Array.from(idxs).sort((a, b) => a - b)
}

// Sampled from the stable ID list, so loading data never changes which shots are shown
const summaryIds = computed(() => {
  const ids = allIds.value
  const k = Math.min(summaryCount.value, summaryMax, ids.length)
  const idxs = sampleIndices(ids.length, k)

  // Ensure the selected item is included. At the cap it replaces the nearest sampled shot
  const sel = ids.indexOf(selectedId.value)
  if (sel !== -1 && !idxs.includes(sel)) {
    if (idxs.length < summaryMax) {
      idxs.push(sel)
    } else {
      let nearest = 0
      for (let i = 1; i < idxs.length; i++) {
        if (Math.abs(idxs[i] - sel) < Math.abs(idxs[nearest] - sel)) nearest = i
      }
      idxs[nearest] = sel
    }
    idxs.sort((a, b) => a - b)
  }
  return idxs.map(i => ids[i])
})

// In-video search results, loaded in pages as the grid scrolls
const searchPageSize = 30
const shownCount = ref(searchPageSize)

watch(() => props.searchResults, () => { shownCount.value = searchPageSize })

const isSearching = computed(() => props.searchResults != null)

const displayedIds = computed(() =>
  props.searchResults ? props.searchResults.slice(0, shownCount.value) : summaryIds.value
)

const hasMoreResults = computed(() => !!props.searchResults && shownCount.value < props.searchResults.length)

function loadMore(visible: boolean) {
  if (visible && hasMoreResults.value) shownCount.value += searchPageSize
}

watch(displayedIds, ensureLoaded, { immediate: true })

function onSelect(id: number) {
  emit('select-item', id)
}

// --- Dialog visible count + virtual rows ---
const dialogVisibleCount = computed(() => {
  if (dialogAll.value) return allIds.value.length
  return Math.min(dialogCount.value, allIds.value.length)
})

// Chunk into rows. Each row loads its items when scrolled into view (v-intersect)
const dialogCols = 5
const dialogRowHeight = 190

const dialogRows = computed(() => {
  const rows: number[][] = []
  const ids = allIds.value.slice(0, dialogVisibleCount.value)
  for (let i = 0; i < ids.length; i += dialogCols) {
    rows.push(ids.slice(i, i + dialogCols))
  }
  return rows
})

// Keep dialog slider reasonable as data changes
watch(
  () => allIds.value.length,
  (n) => {
    if (n <= 100) {
      dialogAll.value = true
      dialogCount.value = Math.max(100, n)
    } else {
      // keep within bounds
      if (dialogCount.value < 100) dialogCount.value = 200
      if (dialogCount.value > n) dialogCount.value = n
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.related-root {
  width: 100%;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.related-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.related-controls {
  display: grid;
  grid-template-columns: 70px 1fr;
  align-items: center;
  gap: 10px;
}

/* Vertical preview grid fills the height left in the viewer and scrolls for more */
.preview-wrap {
  flex: 1 1 0;
  min-height: 200px;
  overflow-y: auto;
  padding-right: 4px; /* avoid scrollbar overlay */
}

.preview-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

/* Put border around the tile itself (the first child inside the cell) */
.preview-cell--selected :deep(> *) {
  outline: 2px solid rgba(76, 201, 240, 0.85);
  border-radius: 12px;
}

.results-sentinel {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.empty {
  opacity: 0.7;
  padding: 8px 0;
}

.related-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.dialog-body {
  padding: 12px;
}

.dialog-controls {
  margin-bottom: 12px;
}

.dialog-row {
  padding: 6px 0;
}

.dialog-row-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.dialog-cell--selected {
  outline: 2px solid rgba(76, 201, 240, 0.85);
  border-radius: 12px;
}
          
:deep(.v-slider-thumb__label) {
  background: rgb(175, 163, 209) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
}
</style>