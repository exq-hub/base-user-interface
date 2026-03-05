<template>
  <div :data-eid="eid('root')" class="related-root">
    <!-- Header -->
    <div class="related-header" :data-eid="eid('header')">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-2 font-weight-bold">Related</div>
        <v-chip :data-eid="eid('count')" size="x-small" label variant="outlined">
          {{ allItems.length }}
        </v-chip>
      </div>

      <div class="d-flex align-center ga-2">
        <v-btn
         :data-eid="eid('btn_open_dialog')"
         variant="outlined"
         size="small"
         @click="dialogOpen = true"
         :disabled="allItems.length === 0"
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
      v-if="summaryItems.length > 0"
    >
      <div class="preview-grid" :data-eid="eid('preview_grid')">
        <div
         v-for="it in summaryItems"
         :key="it.id"
         class="preview-cell"
         :class="{ 'preview-cell--selected': it.id === selectedId }"
         :data-eid="eid(`preview_cell_${it.id}`)"
        >
          <ItemTile
           :data-eid="eid(`itemtile_${it.id}`)"
           :item-id="it.id"
           :model-id="modelId"
           :item="it"
           :group-info="null"
           :tile-width="tileWidth"
           :aspect-ratio="aspectRatio"
           :btn-pos="true"
           :btn-neg="true"
           :btn-submit="false"
           :show-remove="true"
           :remove-set="itemStore.isItemInPos(it.id, props.modelId) ? ILSets.Positives : itemStore.isItemInNeg(it.id, props.modelId) ? ILSets.Negatives : null"
           :history-enabled="false"
           :enable-hover-preview="false"
           @open="onSelect(it.id)"
           @add="onAdd"
           @remove="onRemove"
          />
        </div>
      </div>
    </div> 

    <div v-else class="empty" :data-eid="eid('empty')">
      No related items.
    </div>

    <!-- Dialog for dense/all view -->
    <v-dialog v-model="dialogOpen" max-width="1200" scrollable :data-eid="eid('dialog')">
      <v-card rounded="lg" :data-eid="eid('dialog_card')">
        <v-card-title class="d-flex align-center justify-space-between" :data-eid="eid('dialog_header')">
          <div class="d-flex align-center ga-2">
            <div class="text-subtitle-1 font-weight-bold">Related items</div>
            <v-chip size="x-small" label variant="outlined" :data-eid="eid('dialog_count')">
              {{ allItems.length }}
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
               :min="Math.min(100, allItems.length || 100)"
               :max="Math.max(100, allItems.length || 100)"
               :step="10"
               hide-details
               thumb-label="always"
               density="compact"
               :disabled="allItems.length <= 100"
              />

              <v-checkbox
               v-model="dialogAll"
               :data-eid="eid('dialog_all_toggle')"
               hide-details
               density="compact"
               label="All"
               :disabled="allItems.length <= 100"
              />
            </div>

            <div class="text-caption opacity-70">
              Showing: {{ dialogVisibleCount }} / {{ allItems.length }}
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
              <div class="dialog-row" :data-eid="eid(`dialog_row_${index}`)">
                <div class="dialog-row-grid">
                  <div
                   v-for="it in row"
                   :key="it.id"
                   class="dialog-cell"
                   :class="{ 'dialog-cell--selected': it.id === selectedId }"
                   :data-eid="eid(`dialog_cell_${it.id}`)"
                  >
                    <ItemTile
                     :data-eid="eid(`dialog_itemtile_${it.id}`)"
                     :item-id="it.id"
                     :model-id="modelId"
                     :item="it"
                     :group-info="null"
                     :tile-width="dialogTileWidth"
                     :aspect-ratio="aspectRatio"
                     :btn-pos="true"
                     :btn-neg="true"
                     :btn-submit="false"
                     :show-remove="true"
                     :remove-set="itemStore.isItemInPos(it.id, props.modelId) ? ILSets.Positives : itemStore.isItemInNeg(it.id, props.modelId) ? ILSets.Negatives : null"
                     :history-enabled="false"
                     :enable-hover-preview="false"
                     @open="onSelect(it.id)"
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
import { computed, ref, watch } from 'vue'
import ItemTile from '@/components/items/ItemTile.vue'
import { useItemStore } from '@/stores/item'
import { useModelStore } from '@/stores/model'
import type MediaItem from '@/types/mediaitem'
import { ILSets } from '@/types/mediaitem'

const props = defineProps<{
  modelId: number
  mediaItem: MediaItem
  relatedItems: number[]          // ids
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
const summaryCount = ref(60)

const dialogAll = ref(false)
const dialogCount = ref(200)

const tileWidth = 170
const dialogTileWidth = 200
const aspectRatio = 16 / 9

const itemsMap = ref<Map<number, MediaItem>>(new Map())

function getTimeMs(it: MediaItem): number {
  const md: any = it.metadata ?? {}
  const toNum = (v: any) => (typeof v === 'string' ? Number(v) : v)

  const s = toNum(md['Start (ms)'])
  if (typeof s === 'number' && Number.isFinite(s)) return s

  const k = toNum(md['Keyframe (ms)'])
  if (typeof k === 'number' && Number.isFinite(k)) return k

  return 0
}

function onAdd(payload: { itemId: number; set: ILSets }) {
  itemStore.addItemToSet(payload.itemId, props.modelId, payload.set)
}

function onRemove(payload: { itemId: number; set: ILSets }) {
  itemStore.removeItemFromSet(payload.itemId, props.modelId, payload.set)
}

async function loadAllRelated(ids: number[]) {
  if (!ids || ids.length === 0) {
    itemsMap.value = new Map()
    return
  }

  // Fetch via cache-aware store
  const fetched = await itemStore.fetchMediaItems(ids, props.modelId, collection.value)
  const m = new Map<number, MediaItem>()
  for (const it of fetched) m.set(it.id, it)
  itemsMap.value = m
}

watch(
  () => props.relatedItems,
  (ids) => { void loadAllRelated(ids ?? []) },
  { immediate: true }
)

const allItems = computed(() => {
  const arr = Array.from(itemsMap.value.values())
  arr.sort((a, b) => getTimeMs(a) - getTimeMs(b))
  return arr
})

const selectedId = computed(() => props.mediaItem?.id ?? -1)

// --- Summary sampling (cap 100) ---
function sampleEvenly<T>(arr: T[], k: number): T[] {
  const n = arr.length
  if (n === 0) return []
  if (k >= n) return arr.slice()

  if (k <= 1) return [arr[Math.floor((n - 1) / 2)]]

  const idxs = new Set<number>()
  for (let i = 0; i < k; i++) {
    const idx = Math.round((i * (n - 1)) / (k - 1))
    idxs.add(idx)
  }
  return Array.from(idxs).sort((a, b) => a - b).map(i => arr[i])
}

const summaryItems = computed(() => {
  const arr = allItems.value
  if (arr.length === 0) return []

  const k = Math.min(summaryCount.value, summaryMax, arr.length)
  let sampled = sampleEvenly(arr, k)

  // Ensure selected item is included
  const sid = selectedId.value
  if (sid !== -1 && !sampled.some(x => (x as any).id === sid)) {
    const found = arr.find(x => x.id === sid)
    if (found) {
      sampled = sampled.slice()
      sampled.push(found)
      sampled.sort((a, b) => getTimeMs(a) - getTimeMs(b))
      // keep within cap by dropping farthest in time from selected
      if (sampled.length > summaryMax) sampled = sampled.slice(sampled.length - summaryMax)
    }
  }
  return sampled
})

function onSelect(id: number) {
  emit('select-item', id)
}

// --- Dialog visible count + virtual rows ---
const dialogVisibleCount = computed(() => {
  if (dialogAll.value) return allItems.value.length
  return Math.min(dialogCount.value, allItems.value.length)
})

const dialogItems = computed(() => {
  const arr = allItems.value
  const n = dialogVisibleCount.value
  return arr.slice(0, n)
})

// chunk into rows
const dialogCols = 5
const dialogRowHeight = 190

const dialogRows = computed(() => {
  const rows: MediaItem[][] = []
  const arr = dialogItems.value
  for (let i = 0; i < arr.length; i += dialogCols) {
    rows.push(arr.slice(i, i + dialogCols))
  }
  return rows
})

// Keep dialog slider reasonable as data changes
watch(
  () => allItems.value.length,
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

/* Vertical preview grid: show ~4 rows comfortably, scroll for more */
.preview-wrap {
  /* tune to get ~4 rows visible; 170px tiles + gaps ends up around this */
  max-height: 35vh;
  overflow-y: auto;
  padding-right: 4px; /* avoid scrollbar overlay */
}

.preview-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

@media (max-height: 700px) {
  .preview-wrap {
    max-height: 280px;
  }
}

/* Put border around the tile itself (the first child inside the cell) */
.preview-cell--selected :deep(> *) {
  outline: 2px solid rgba(76, 201, 240, 0.85);
  border-radius: 12px;
}

.empty {
  opacity: 0.7;
  padding: 8px 0;
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