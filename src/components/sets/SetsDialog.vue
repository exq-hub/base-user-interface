<template>
  <v-dialog v-model="openProxy" :data-eid="eid('dialog')" max-width="1200" scrollable>
    <v-card :data-eid="eid('card')" rounded="lg">
      <v-card-title class="d-flex align-center justify-space-between" :data-eid="eid('header')">
        <div class="d-flex align-center ga-2">
          <div class="text-subtitle-1 font-weight-bold" :data-eid="eid('title')">
            {{ title }}
          </div>
          <v-chip :data-eid="eid('count')" size="x-small" label variant="outlined">
            {{ items.length }}
          </v-chip>
        </div>

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
      </v-card-title>

      <v-divider />

      <v-card-text :data-eid="eid('body')" class="body">
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
            :history-enabled="false"
            :show-remove="true"
            :remove-set="props.set"
            :enable-hover-preview="true"
            @open="$emit('open-item', it.id)"
            @add="onAdd"
            @remove="onRemove"
          />
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions :data-eid="eid('actions_footer')" class="px-4 py-3">
        <v-spacer />
        <v-btn :data-eid="eid('btn_close_bottom')" variant="outlined" @click="openProxy = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ItemTile from '@/components/items/ItemTile.vue'
import { useItemStore } from '@/stores/item'
import { ILSets } from '@/types/mediaitem'

const props = defineProps<{
  modelId: number
  set: ILSets
  modelValue: boolean

  tileWidth?: number
  aspectRatio?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'open-item', itemId: number): void
}>()

const itemStore = useItemStore()

const tileWidth = computed(() => props.tileWidth ?? 260)
const aspectRatio = computed(() => props.aspectRatio ?? 16 / 9)

const eidBase = computed(() => `sets_dialog_${props.set}_model_${props.modelId}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const openProxy = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const showOppositeNeg = computed(() => props.set === ILSets.Positives) // move to Neg
const showOppositePos = computed(() => props.set === ILSets.Negatives) // move to Pos

const title = computed(() => {
  switch (props.set) {
    case ILSets.Positives: return 'Positives'
    case ILSets.Negatives: return 'Negatives'
    case ILSets.History: return 'History'
    case ILSets.Submitted: return 'Submitted'
    default: return 'Set'
  }
})
const items = computed(() => itemStore.getSetItems(props.modelId, props.set))

function onAdd(payload: { itemId: number; set: ILSets }) {
  itemStore.addItemToSet(payload.itemId, props.modelId, payload.set)
}

function onRemove(payload: { itemId: number; set: ILSets }) {
  itemStore.removeItemFromSet(payload.itemId, props.modelId, payload.set)
}
</script>

<style scoped>
.body {
  padding: 12px;
}

.empty {
  opacity: 0.75;
  padding: 16px 8px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}
</style>