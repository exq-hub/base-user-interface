<template>
  <v-menu
   v-model="open"
   :close-on-content-click="false"
   location="bottom end"
   offset="8"
   :data-eid="eid('menu')"
  >
    <template #activator="{ props: actProps }">
      <v-tooltip text="Metadata" location="bottom" :open-delay="350" :close-delay="150">
        <template #activator="{ props: tipProps }">
          <v-btn
           v-bind="{ ...actProps, ...tipProps }"
           :data-eid="eid('btn_info')"
           icon
           size="small"
           variant="text"
           :disabled="!item"
          >
            <v-icon>mdi-information-outline</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </template>

    <v-card class="meta-popover" rounded="lg" :data-eid="eid('card')">
      <v-card-title class="meta-header" :data-eid="eid('header')">
        <div class="text-subtitle-2 font-weight-bold">Metadata</div>
    
        <div class="d-flex align-center ga-1">
          <v-tooltip :text="allExpanded ? 'Collapse all' : 'Expand all'" location="bottom">
            <template #activator="{ props: tipProps }">
              <v-btn
               v-bind="tipProps"
               :data-eid="eid('btn_expand_all')"
               icon
               size="small"
               variant="text"
               @click="toggleExpandAll"
              >
                <v-icon>{{ allExpanded ? 'mdi-unfold-less-horizontal' : 'mdi-unfold-more-horizontal' }}</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
  
          <v-tooltip text="Close" location="bottom">
            <template #activator="{ props: tipProps }">
              <v-btn
               v-bind="tipProps"
               :data-eid="eid('btn_close')"
               icon
               size="small"
               variant="text"
               @click="open = false"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="meta-body" :data-eid="eid('body')">
        <v-expansion-panels
         multiple
         variant="accordion"
         v-model="expandedPanels"
         :data-eid="eid('panels')"
        >
          <!-- Video info -->
          <v-expansion-panel
           v-if="hasVideoMeta"
           :data-eid="eid('panel_video')"
          >
            <v-expansion-panel-title>Video Information</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <template v-for="k in videoKeys" :key="k">
                  <v-col cols="12">
                    <div class="meta-row">
                      <div class="meta-key">{{ k }}</div>
                      <div class="meta-val">
                        <template v-if="Array.isArray((group as any).metadata[k])">
                          <v-chip
                           v-for="i in (group as any).metadata[k]"
                           :key="String(i)"
                           size="small"
                           variant="outlined"
                           class="mx-1 my-1"
                          >
                            {{ i }}
                          </v-chip>
                        </template>
                        <template v-else>
                          <v-chip size="small" variant="outlined" class="mx-1 my-1">
                            {{ (group as any).metadata[k] }}
                          </v-chip>
                        </template>
                      </div>
                    </div>
                  </v-col>
                </template>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Shot info (main) -->
          <v-expansion-panel
           v-if="hasItemMeta"
           :data-eid="eid('panel_shot')"
          >
            <v-expansion-panel-title>Shot Information</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <template v-for="k in shotKeys" :key="k">
                  <v-col cols="12">
                    <div class="meta-row">
                      <div class="meta-key">{{ k }}</div>
                      <div class="meta-val">
                        <template v-if="Array.isArray((item as any).metadata[k])">
                          <v-chip
                           v-for="i in (item as any).metadata[k]"
                           :key="String(i)"
                           size="small"
                           variant="outlined"
                           class="mx-1 my-1"
                          >
                            {{ i }}
                          </v-chip>
                        </template>
                        <template v-else>
                          <v-chip size="small" variant="outlined" class="mx-1 my-1">
                            {{ (item as any).metadata[k] }}
                          </v-chip>
                        </template>
                      </div>
                    </div>
                  </v-col>
                </template>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- More -->
          <v-expansion-panel
           v-if="hasItemMeta && moreKeys.length > 0"
           :data-eid="eid('panel_more')"
          >
            <v-expansion-panel-title>More</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <template v-for="k in moreKeys" :key="k">
                  <v-col cols="12">
                    <div class="meta-row">
                      <div class="meta-key">{{ k }}</div>
                      <div class="meta-val">
                        <template v-if="Array.isArray((item as any).metadata[k])">
                          <v-chip
                           v-for="i in (item as any).metadata[k]"
                           :key="String(i)"
                           size="small"
                           variant="outlined"
                           class="mx-1 my-1"
                          >
                            {{ i }}
                          </v-chip>
                        </template>
                        <template v-else>
                          <v-chip
                           v-if="String((item as any).metadata[k]) !== '[]'"
                           size="small"
                           variant="outlined"
                           class="mx-1 my-1"
                          >
                            {{ (item as any).metadata[k] }}
                          </v-chip>
                        </template>
                      </div>
                    </div>
                  </v-col>
                </template>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <div v-if="!hasVideoMeta && !hasItemMeta" class="empty" :data-eid="eid('empty')">
          No metadata available.
        </div>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type MediaItem from '@/types/mediaitem'

type AnyGroup = {
  metadata?: Record<string, any>
}

const props = defineProps<{
  modelId: string | number
  item: MediaItem | null
  group: AnyGroup | null
  
  // Pass your filterStore helpers in
  isMainKey: (key: string) => boolean
  isGroupKey: (key: string) => boolean
}>()

const eidBase = computed(() => `media_meta_model_${props.modelId}_item_${props.item?.id ?? 'none'}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const open = ref(false)
const expandedPanels = ref<number[]>([])

const hasItemMeta = computed(() => !!props.item && !!props.item.metadata && Object.keys(props.item.metadata).length > 0)
const hasVideoMeta = computed(() => !!props.group?.metadata && Object.keys(props.group.metadata).some(k => props.isGroupKey(k)))

const videoKeys = computed(() => {
  const md = props.group?.metadata ?? {}
  return Object.keys(md).filter(k => props.isGroupKey(k))
})

const shotKeys = computed(() => {
  const md = props.item?.metadata ?? {}
  return Object.keys(md).filter(k => props.isMainKey(k))
})

const moreKeys = computed(() => {
  const md = props.item?.metadata ?? {}
  return Object.keys(md).filter(k => !props.isMainKey(k))
})

// Expand/collapse all panels that exist.
// Panel index order corresponds to rendering order: video=0, shot=1, more=2 (but some may be missing).
const existingPanelIndexes = computed(() => {
  const idx: number[] = []
  let i = 0
  if (hasVideoMeta.value) idx.push(i++)
  else i++
  if (hasItemMeta.value) idx.push(i++)
  else i++
  if (hasItemMeta.value && moreKeys.value.length > 0) idx.push(i++)
  return idx
})

const allExpanded = computed(() => {
  const want = existingPanelIndexes.value
  return want.length > 0 && want.every(i => expandedPanels.value.includes(i))
})

function toggleExpandAll() {
  if (allExpanded.value) {
    expandedPanels.value = []
  } else {
    expandedPanels.value = existingPanelIndexes.value.slice()
  }
}

// When the menu opens, default-expand Shot Information (if present) for convenience.
watch(open, (isOpen) => {
  if (!isOpen) return
  // Determine panel index for Shot (depends on whether Video panel exists)
  // If video panel exists => shot is 1, else shot is 0.
  const shotIdx = hasVideoMeta.value ? 1 : 0
  if (hasItemMeta.value && !expandedPanels.value.includes(shotIdx)) {
    expandedPanels.value = [shotIdx]
  }
})
</script>

<style scoped>
.meta-popover {
  width: min(560px, 92vw);
}

.meta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  background-color: rgba(255, 255, 255, 0.12);
}

.meta-body {
  max-height: 55vh;
  overflow: auto;
  padding: 10px 12px;
  background-color: rgba(255, 255, 255, 0.12);
}

.meta-row {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 8px;
  align-items: start;
}

.meta-key {
  font-weight: 700;
  font-size: 0.9rem;
  opacity: 0.9;
}

.meta-val :deep(.v-chip) {
  height: auto !important;
  width: fit-content;
}

.meta-val :deep(.v-chip__content) {
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.empty {
  opacity: 0.7;
  padding: 10px 0;
}
</style>