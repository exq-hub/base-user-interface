<template>
  <div class="theme-btn-wrap">
    <v-tooltip text="Theme (click toggles, Shift-click opens menu)" location="bottom" :open-delay="350" :close-delay="150">
      <template #activator="{ props: tipProps }">
        <v-btn
          v-bind="tipProps"
          :data-eid="`theme_btn_model_${modelId}`"
          icon
          variant="text"
          size="small"
          @click="onClick"
        >
          <v-icon>{{ currentIcon }}</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <v-menu
      v-model="menuOpen"
      :close-on-content-click="false"
      location="bottom end"
      offset="8"
    >
      <!-- Dummy activator to satisfy Vuetify; we open purely via v-model -->
      <template #activator="{ props }">
        <span v-bind="props"></span>
      </template>

      <v-card rounded="lg" style="min-width: 280px;" @click.stop>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-subtitle-2 font-weight-bold">Theme</div>
          <v-chip size="x-small" variant="outlined">{{ appStore.themeId }}</v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text class="pt-3">
          <div class="text-caption mb-2 opacity-70">Theme preset</div>
          <v-select
            :data-eid="`theme_preset_select_${modelId}`"
            v-model="appStore.themeId"
            :items="themePresets"
            density="comfortable"
            variant="outlined"
            hide-details
          />
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn variant="outlined" size="small" @click="menuOpen = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore, type ThemeId } from '@/stores/app'

const props = defineProps<{ modelId: number }>()
const appStore = useAppStore()
const vuetifyTheme = useTheme()

const menuOpen = ref(false)

const themePresets: ThemeId[] = ['light', 'graphiteDark', 'softDark']

const isLight = computed(() => appStore.themeId === 'light')
const currentIcon = computed(() => (isLight.value ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'))

function toggleLightDark() {
  if (appStore.themeId === 'light') {
    appStore.themeId = appStore.lastDarkThemeId
  } else {
    appStore.lastDarkThemeId = appStore.themeId as Exclude<ThemeId, 'light'>
    appStore.themeId = 'light'
  }
}

function onClick(e: MouseEvent) {
  if (e.shiftKey) menuOpen.value = true
  else toggleLightDark()
}

watch(
  () => appStore.themeId,
  () => { vuetifyTheme.global.name.value = appStore.themeId },
  { immediate: true }
)
</script>

<style scoped>
.theme-btn-wrap {
  display: inline-flex;
}
</style>