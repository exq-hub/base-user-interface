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
      color="orange-darken-2"
      variant="tonal"
      size="small"
      prepend-icon="mdi-timeline-outline"
      class="temporal-btn temporal-btn--open"
      @click="$emit('open')"
    >
      Temporal Search ({{ count }})
    </v-btn>

    <v-btn
      :data-eid="eid('btn_clear')"
      color="red-lighten-1"
      variant="tonal"
      size="small"
      prepend-icon="mdi-close"
      class="temporal-btn"
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
/* Buttons share the row and Clear wraps to its own line when the panel is narrow */
.temporal-actions {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 12px;
}

.temporal-actions .temporal-btn {
  flex: 1 1 auto;
  margin-inline-start: 0;
}

.temporal-btn--open {
  flex-grow: 2;
}
</style>