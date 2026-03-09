<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <div ref="rootEl" :data-eid="eid('root')" class="searchbar">
    <v-text-field
      v-model="text"
      :data-eid="eid('input')"
      density="compact"
      variant="outlined"
      hide-details
      clearable
      label="Search"
      @keyup.enter="emitSearch()"
    />

    <div class="d-flex align-center ga-2 pt-2" :data-eid="eid('actions')">
      <!-- Search -->
      <v-btn
       :data-eid="eid('btn_search')"
       color="primary"
       :icon="compactActions"
       density="comfortable"
       @click="emitSearch()"
      >
        <v-icon>mdi-magnify</v-icon>
        <template v-if="!compactActions">
          <v-divider class="border-opacity-0" vertical :thickness="6" />
          Search
        </template>
      </v-btn>

      <!-- Filters -->
      <v-btn
       :data-eid="eid('btn_filters')"
       color="secondary"
       :icon="compactActions"
       density="comfortable"
       @click="$emit('open-filters')"
      >
        <v-icon>mdi-filter-outline</v-icon>
        <template v-if="!compactActions">
          <v-divider class="border-opacity-0" vertical :thickness="6" />
          Filters
        </template>
      </v-btn>

      <!-- Image upload stays icon-only always -->
      <v-tooltip text="Upload image for search" :open-delay="700" :close-delay="200" location="top">
        <template #activator="{ props: tipProps }">
          <v-btn
           v-bind="tipProps"
           :data-eid="eid('btn_image_upload')"
           color="text"
           icon
           variant="text"
           @click="$emit('open-image')"
          >
            <v-icon>mdi-image-plus</v-icon>
          </v-btn>
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelId: number
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'search'): void
  (e: 'open-filters'): void
  (e: 'open-image'): void
}>()


const eidBase = computed(() => `searchbar_model_${props.modelId}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}

const text = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v)
})

function emitSearch() {
  emit('search')
}

// --- Responsive action mode based on actual container width ---
const rootEl = ref<HTMLElement | null>(null)
const compactActions = ref(false)

// Tune this threshold to taste; ~320-360 works well for a narrow side panel
const COMPACT_THRESHOLD = 340

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!rootEl.value) return

  const update = () => {
    const w = rootEl.value?.getBoundingClientRect().width ?? 9999
    compactActions.value = w < COMPACT_THRESHOLD
  }

  update()

  ro = new ResizeObserver(() => update())
  ro.observe(rootEl.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})
</script>

<style scoped>
.searchbar {
  width: 100%;
}
</style>