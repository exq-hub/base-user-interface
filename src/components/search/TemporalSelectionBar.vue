<!-- SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan -->
<!-- SPDX-License-Identifier: AGP-3.0-or-later -->
<template>
  <v-card-actions
    v-if="count > 1"
    :data-eid="eid('root')"
    class="temporal-actions"
  >
    <v-btn
      :data-eid="eid('btn_open')"
      color="orange-darken-4"
      density="compact"
      class="ma-2"
      @click="$emit('open')"
    >
      Temporal Search ({{ count }})
    </v-btn>

    <v-btn
      :data-eid="eid('btn_clear')"
      color="red-darken-4"
      density="compact"
      class="ma-2"
      @click="$emit('clear')"
    >
      Clear
    </v-btn>
  </v-card-actions>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelId: number
  count: number
}>()

defineEmits<{
  (e: 'open'): void
  (e: 'clear'): void
}>()

const eidBase = computed(() => `temporalbar_model_${props.modelId}`)
function eid(part: string) {
  return `${eidBase.value}__${part}`
}
</script>

<style scoped>
.temporal-actions {
  border-top: 1px solid rgba(0,0,0,0.08);
}
</style>