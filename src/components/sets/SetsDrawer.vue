<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-navigation-drawer
    v-model="openProxy"
    :location="location"
    :width="width"
    :data-eid="eid('drawer')"
    class="sets-drawer"
    floating
  >
    <div class="drawer-header" :data-eid="eid('header')">
      <div class="d-flex align-center ga-2">
        <div class="text-subtitle-2 font-weight-bold" :data-eid="eid('title')">
          {{ title }}
        </div>
        <v-chip :data-eid="eid('count')" size="x-small" label variant="outlined">
          {{ items.length }}
        </v-chip>
      </div>

      <div class="d-flex align-center ga-1">
        <v-tooltip text="Pop out to dialog" location="bottom">
          <template #activator="{ props: tipProps }">
            <v-btn
              v-bind="tipProps"
              :data-eid="eid('btn_popout')"
              icon
              size="small"
              variant="text"
              @click="$emit('popout')"
            >
              <v-icon>mdi-open-in-new</v-icon>
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
              @click="openProxy = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>
    </div>

    <v-divider />

    <div class="drawer-body" :data-eid="eid('body')">
      <div v-if="items.length === 0" class="empty" :data-eid="eid('empty')">
        No items in {{ title.toLowerCase() }}.
      </div>

      <div v-else class="grid" :data-eid="eid('grid')">
        <ItemTile
         v-for="it in items"
         :key="it.id"
         :data-eid="eid(`itemtile_${it.id}`)"
         :item-id="it.id"
         :model-id="modelId"
         :item="it"
         :group-info="null"
         :tile-width="tileWidth"
         :aspect-ratio="aspectRatio"
         :btn-pos="showOppositePos"
         :btn-neg="showOppositeNeg"
         :btn-submit="false"
         :history-enabled="historyEnabled && props.set !== ILSets.History"
         :show-remove="true"
         :remove-set="props.set"
         :enable-hover-preview="true"
         @open="$emit('open-item', it.id)"
         @add="onAdd"
         @remove="onRemove"
        />
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ItemTile from '@/components/items/ItemTile.vue'
import { useItemStore } from '@/stores/item'
import { ILSets } from '@/types/mediaitem'
import { useModelStore } from '@/stores/model';


const props = defineProps<{
  modelId: number
  set: ILSets
  modelValue: boolean

  width?: number
  location?: 'left' | 'right'
  tileWidth?: number
  aspectRatio?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'popout'): void
  (e: 'open-item', itemId: number): void
}>()

const itemStore = useItemStore()
const modelStore = useModelStore()

const historyEnabled = computed(() => modelStore.activeModel!.settings.historyEnabled)

const location = computed(() => props.location ?? 'right')
const width = computed(() => props.width ?? 360)
const tileWidth = computed(() => props.tileWidth ?? 190)
const aspectRatio = computed(() => props.aspectRatio ?? 16 / 9)

const eidBase = computed(() => `sets_drawer_${props.set}_model_${props.modelId}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const openProxy = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// Opposite button shown via ItemTile's built-in add buttons
const showOppositeNeg = computed(() => props.set === ILSets.Positives || props.set === ILSets.Excluded || props.set === ILSets.History) // move to Neg
const showOppositePos = computed(() => props.set === ILSets.Negatives || props.set === ILSets.Excluded || props.set === ILSets.History) // move to Pos

const title = computed(() => {
  switch (props.set) {
    case ILSets.Positives: return 'Positives'
    case ILSets.Negatives: return 'Negatives'
    case ILSets.History: return 'History'
    case ILSets.Submitted: return 'Submitted'
    case ILSets.Excluded: return 'Excluded'
    default: return 'Set'
  }
})

const items = computed(() => itemStore.getSetItems(props.modelId, props.set))

function onAdd(payload: { itemId: number; set: ILSets }) {
  // Clicking opposite button moves item by setting that set (your store clears the other)
  itemStore.addItemToSet(payload.itemId, props.modelId, payload.set)
}

function onRemove(payload: { itemId: number; set: ILSets }) {
  itemStore.removeItemFromSet(payload.itemId, props.modelId, payload.set)
}
</script>

<style scoped>
.sets-drawer {
  border-left: 1px solid rgba(255,255,255,0.08);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 10px;
}

.drawer-body {
  padding: 10px;
}

.empty {
  opacity: 0.75;
  padding: 16px 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
</style>