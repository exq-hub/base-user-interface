<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-dialog v-model="isOpen" max-width="640" scrollable>
    <v-card :disabled="loadingResults" :loading="loadingResults" data-eid="temporal_dialog">
      <template v-slot:loader="{ isActive }">
        <v-progress-linear
         :active="isActive"
         color="deep-purple"
         height="4"
         indeterminate
        ></v-progress-linear>
      </template>

      <v-card-item>
        <v-card-title>Temporal Search</v-card-title>
        <v-card-subtitle>Events in the order they happen</v-card-subtitle>
        <template #append>
          <v-btn
           data-eid="temporal_dialog_btn_close_icon"
           icon="mdi-close"
           size="small"
           variant="text"
           @click="close"
          />
        </template>
      </v-card-item>

      <v-divider />

      <v-card-text class="hop-list">
        <div v-if="hops.length === 0" class="text-medium-emphasis text-center py-6">
          No events left, close the dialog and select some searches
        </div>

        <template v-for="(q, idx) in hops" :key="q.id">
          <div class="hop-row" :data-eid="`temporal_hop_${q.id}`">
            <div class="hop-badge">{{ idx + 1 }}</div>

            <div class="hop-body min-w-0">
              <!-- Image searches will become kind 'query' hops too, show their image preview here then -->
              <div class="text-subtitle-1 font-weight-medium text-truncate">{{ q.name }}</div>
              <div v-if="q.text !== q.name" class="text-body-2 text-medium-emphasis text-truncate">
                {{ q.text }}
              </div>
              <div class="d-flex flex-wrap ga-1 mt-1">
                <v-chip
                 v-if="hopIndexLabel(q)"
                 size="x-small"
                 label
                 variant="tonal"
                 prepend-icon="mdi-database-search-outline"
                >
                  {{ hopIndexLabel(q) }}
                </v-chip>
                <v-chip
                 v-for="chip in filterChips(q)"
                 :key="chip"
                 size="x-small"
                 label
                 variant="outlined"
                >
                  {{ chip }}
                </v-chip>
              </div>
            </div>

            <div class="hop-actions">
              <v-btn
               :data-eid="`temporal_hop_up_${q.id}`"
               icon="mdi-arrow-up"
               size="small"
               density="comfortable"
               variant="text"
               :disabled="idx === 0"
               @click="move(idx, -1)"
              />
              <v-btn
               :data-eid="`temporal_hop_down_${q.id}`"
               icon="mdi-arrow-down"
               size="small"
               density="comfortable"
               variant="text"
               :disabled="idx === hops.length - 1"
               @click="move(idx, 1)"
              />
              <v-btn
               :data-eid="`temporal_hop_remove_${q.id}`"
               icon="mdi-delete-outline"
               size="small"
               density="comfortable"
               variant="text"
               color="error"
               @click="remove(idx)"
              />
            </div>
          </div>

          <div v-if="idx < hops.length - 1" class="hop-connector">
            <div class="hop-connector__line" />
            <v-icon size="small" color="primary">mdi-chevron-down</v-icon>
          </div>
        </template>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-6 py-4">
        <v-btn data-eid="temporal_dialog_btn_reset" variant="text" @click="resetOrder">
          Reset order
        </v-btn>
        <v-spacer />
        <v-btn data-eid="temporal_dialog_btn_cancel" variant="text" @click="close">
          Cancel
        </v-btn>
        <v-btn
         data-eid="temporal_dialog_btn_search"
         color="primary"
         variant="flat"
         :disabled="hops.length < 2"
         @click="search"
        >
          Search
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { logEvents } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useFilterStore } from '@/stores/filter';
import { useModelStore } from '@/stores/model';
import { useSearchIndexStore } from '@/stores/searchIndex';
import { useTemporalSearchStore } from '@/stores/temporalSearchStore';
import { ChatQuery } from '@/types/chat';
import { storeToRefs } from 'pinia';

const tempStore = useTemporalSearchStore()
const { isOpen, temporalSelection, loadingResults } = storeToRefs(tempStore)

const filterStore = useFilterStore()
const modelStore = useModelStore()
const indexStore = useSearchIndexStore()

const collection = computed(() => modelStore.getModelCollection(modelStore.activeModel!.id))

// Falls back to the raw name when the index is not in the fetched list
function hopIndexLabel(q: ChatQuery): string | undefined {
  return indexStore.indexLabel(collection.value, q.indexName) ?? q.indexName
}

// Value filters as "Name: a, b", ranges are not covered by toAppliedFilters
function filterChips(q: ChatQuery): string[] {
  const allInfos = Array.from(filterStore.filtersInfo.values()).flat()
  const applied = filterStore.toAppliedFilters(q.filters, allInfos)
  return Object.entries(applied).map(([id, values]) => {
    const name = allInfos.find(f => f.id === Number(id))?.name ?? id
    return `${name}: ${values.map(v => v.value).join(', ')}`
  })
}

// Order of events, starts as the selection order
const hops = ref<ChatQuery[]>([])

const emit = defineEmits(['show-temporal-results'])

function log(action: string, data?: object) {
  logEvents([{
    ts: Date.now(),
    action: action,
    session: useAppStore().session,
    ...(data !== undefined && { data: JSON.stringify(data) }),
  }])
}

function close() {
  tempStore.close()
}

function move(idx: number, dir: -1 | 1) {
  const [q] = hops.value.splice(idx, 1)
  hops.value.splice(idx + dir, 0, q)
  log('Move Temporal Query', { queryId: q.id, from: idx, to: idx + dir })
}

// Only drops it from this search, the selection in the search panel stays
function remove(idx: number) {
  const [q] = hops.value.splice(idx, 1)
  log('Remove Temporal Query from Selection', { queryId: q.id, queryName: q.name })
}

function resetOrder() {
  hops.value = temporalSelection.value.slice()
  log('Reset Temporal Search Order')
}

async function search() {
  log('Execute Temporal Search', { orderedQueryIds: hops.value.map(q => q.id) })
  const resultIds = await tempStore.search(hops.value)
  emit('show-temporal-results', resultIds)
  close()
}

watch(isOpen, (newVal) => {
  if (newVal) {
    hops.value = temporalSelection.value.slice()
    indexStore.load(collection.value)
    log('Open Temporal Search Dialog')
  } else {
    hops.value = []
    log('Close Temporal Search Dialog')
  }
})

</script>

<style scoped>
.hop-list {
  max-height: 60vh;
}

.hop-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 12px 12px 14px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-primary), 0.3);
  border-left: 4px solid rgb(var(--v-theme-primary));
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition: box-shadow 120ms ease, transform 120ms ease, border-color 120ms ease;
}

.hop-row:hover {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

.hop-badge {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.hop-body {
  flex: 1 1 auto;
}

.hop-actions {
  flex: 0 0 auto;
  display: flex;
}

/* Lines up under the badge, 4px accent plus 14px padding plus half the badge */
.hop-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  margin-left: 18px;
}

.hop-connector__line {
  width: 2px;
  height: 10px;
  background: rgb(var(--v-theme-primary));
  opacity: 0.6;
}
</style>
