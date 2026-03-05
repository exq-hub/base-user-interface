<template>
  <div ref="rootEl" :data-eid="eid('root')">
    <v-virtual-scroll
     :data-eid="eid('scroll')"
     :items="items"
     max-height="70vh"
    >
      <template #default="{ item }" >
        <div
         :data-eid="eid(`item_${item.id}`)"
         class="history-item pa-2"
         :class="{ 'history-item--active': item.id === currentQueryId }"
         @click="$emit('show-results', item.id, item.resultIds)"
        >
          <div class="row-wrap" :class="{ 'row-wrap--active': item.id === currentQueryId }">
            <!-- top line -->
            <div class="row-top" @click="$emit('show-results', item.id, item.resultIds)">
              <div class="row-title min-w-0" :data-eid="eid(`title_${item.id}`)">
                <template v-if="item.searchType === 'text' || item.searchType === 'temporal'">
                  {{ item.name }}
                </template>
                <template v-else>
                  Image query
                </template>
              </div>

              <div class="row-time text-caption opacity-70" :data-eid="eid(`time_${item.id}`)">
                {{ formatTime(item.timestamp) }}
              </div>
            </div>

            <!-- optional image preview -->
            <div v-if="item.searchType === 'image'" class="row-image" :data-eid="eid(`img_${item.id}`)">
              <img :src="item.name" class="row-image__img" />
            </div>

            <!-- bottom line -->
            <div class="row-bottom">
              <div class="row-chips">
                <v-chip :size="chipSize" label variant="tonal" :data-eid="eid(`chip_type_${item.id}`)">
                  {{ item.searchType.toUpperCase() }}
                </v-chip>

                <v-chip :size="chipSize" label variant="tonal" :data-eid="eid(`chip_model_${item.id}`)">
                  {{ item.searchModel.toUpperCase() }}
                </v-chip>

                <div :class="[metaTextClass, 'd-flex align-center ga-2']" :data-eid="eid(`filters_${item.id}`)">
                  <span>Filters ·</span>

                  <template v-if="filterCount(item.filters) === 0">
                    <span>None</span>
                  </template>

                  <template v-else>
                    <v-tooltip location="top" :open-delay="350" :close-delay="150">
                      <template #activator="{ props: tipProps }">
                        <v-chip
                         v-bind="tipProps"
                         :data-eid="eid(`filters_chip_${item.id}`)"
                         size="small"
                         label
                         variant="tonal"
                        >
                          {{ filterCount(item.filters) }}
                        </v-chip>
                      </template>

                      <div class="filter-tooltip">
                        {{ filterTooltipText(item.filters) }}
                      </div>
                    </v-tooltip>
                  </template>
                </div>
              </div>

              <div class="row-actions"> 
                <template v-if="props.temporalMode">
                  <v-tooltip
                    :text="isSelected(item) ? 'Remove from Temporal Search' : 'Add to Temporal Search'"
                    :open-delay="500"
                    :close-delay="150"
                    location="top"
                  >
                    <template #activator="{ props: tipProps }">
                      <v-btn
                        v-bind="tipProps"
                        :data-eid="eid(`tgl_temporal_${item.id}`)"
                        icon
                        size="small"
                        density="compact"
                        variant="text"
                        :color="isSelected(item) ? 'orange-darken-4' : undefined"
                        @click.stop="toggleSelection(item)"
                      >
                        <v-icon>
                          {{ isSelected(item) ? 'mdi-check-circle' : 'mdi-plus-circle-outline' }}
                        </v-icon>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </template>
                <v-tooltip text="Open in Advanced Search" :open-delay="450" :close-delay="150" location="top">
                  <template #activator="{ props: tipProps }">
                    <v-btn
                     v-bind="tipProps"
                     :data-eid="eid(`btn_open_advanced_${item.id}`)"
                     icon
                     size="small"
                     density="compact"
                     variant="text"
                     @click.stop="$emit('open-advanced', item)"
                    >
                      <v-icon>mdi-tune</v-icon>
                    </v-btn>
                  </template>
                </v-tooltip>
   
              </div>
            </div>
          </div>
        </div>
      </template>
    </v-virtual-scroll>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filter'
import type { ChatQuery } from '@/types/chat'
import type { AppliedFilters } from '@/types/filter'

const props = defineProps<{
  modelId: number
  items: ChatQuery[]
  currentQueryId: string | null
  temporalSelection: ChatQuery[]
  temporalMode: boolean
}>()

const emit = defineEmits<{
  (e: 'update:temporalSelection', v: ChatQuery[]): void
  (e: 'show-results', queryId: string, resultIds: number[]): void
  (e: 'open-advanced', q: ChatQuery): void
}>()

const filterStore = useFilterStore()

const eidBase = computed(() => `history_model_${props.modelId}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const tagsetNameById = computed(() => {
  const list = filterStore.filtersInfo.get(props.modelId) ?? []
  const m = new Map<number, string>()
  for (const f of list) m.set(f.id, f.name)
  return m
})

const rootEl = ref<HTMLElement | null>(null)
const containerW = ref(9999)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!rootEl.value) return

  const update = () => {
    containerW.value = rootEl.value?.getBoundingClientRect().width ?? 9999
  }

  update()
  ro = new ResizeObserver(update)
  ro.observe(rootEl.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

const isNarrow = computed(() => containerW.value < 340)

// Use these to choose chip size + text classes
const chipSize = computed(() => (isNarrow.value ? 'x-small' : 'small'))
const metaTextClass = computed(() => (isNarrow.value ? 'text-caption' : 'text-body-2'))

function formatTime(ts: number) {
  return new Date(ts).toLocaleString('sv-SE')
}

function filterCount(filters: AppliedFilters): number {
  if (!filters) return 0
  let c = 0
  for (const arr of Object.values(filters)) {
    if (Array.isArray(arr)) c += arr.length
  }
  return c
}

function filterTooltipText(filters: AppliedFilters): string {
  if (!filters || filterCount(filters) === 0) return 'No filters'

  const blocks: string[] = []

  for (const [tagsetId, arr] of Object.entries(filters)) {
    if (!arr?.length) continue

    const name = tagsetNameById.value.get(Number(tagsetId)) ?? `#${tagsetId}`
    const values = arr.map((v: any) => v.value).join(', ')

    // Tagset name on its own line + values below
    blocks.push(`• ${name.toUpperCase()}\n${values}`)
  }

  // blank line between tagsets
  return blocks.length ? blocks.join('\n\n') : 'No filters'
}

function isSelected(q: ChatQuery) {
  return props.temporalSelection.some(x => x.id === q.id)
}

function toggleSelection(q: ChatQuery) {
  const cur = props.temporalSelection.slice()
  const idx = cur.findIndex(x => x.id === q.id)
  if (idx >= 0) cur.splice(idx, 1)
  else cur.push(q)
  emit('update:temporalSelection', cur)
}
</script>

<style scoped>
/* .history-item {
  border: 1px solid transparent;
  border-radius: 8px;
  transition: background 120ms ease, border-color 120ms ease;
} */
.history-item {
  position: relative;
  cursor: pointer;
}

.history-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 999px;
  background: rgb(83, 170, 208);
}

.history-item:hover {
  background: rgba(0,0,0,0.03);
}

.history-item--active {
  border-color: rgba(195, 0, 255, 0.20);
  background: rgba(195, 0, 255, 0.06);
}
              
.filter-tooltip {
  max-width: 360px;        /* tune as you like */
  white-space: pre-wrap;   /* keeps newline between tagsets, wraps long values */
  word-break: break-word;
  line-height: 1.25;
}

.history-item .v-selection-control {
  margin: 0;
}
                
.row-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.row-title {
  font-weight: 700;
  font-size: 0.9rem;

  white-space: normal;        /* allow wrap */
  overflow: visible;          /* no clipping */
  text-overflow: clip;        /* no ellipsis */
  word-break: break-word;     /* break long tokens */
  overflow-wrap: anywhere;    /* wrap very long strings */
}

.row-time {
  white-space: nowrap;
  font-weight: 600;
}

.row-image__img {
  max-width: 55%;
  border-radius: 8px;
  display: block;
}

.row-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.row-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
</style>