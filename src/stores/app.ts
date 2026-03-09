// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { getMainURI } from "@/services/ExquisitorAPI"
import { defineStore } from "pinia"
import { ref, reactive } from "vue"

interface Collection {
  name: string
  description?: string
}

export type ThemeId = 'light' | 'graphiteDark' | 'softDark' | 'dark'

export const useAppStore = defineStore('app', () => {
  // existing
  const session = ref('')
  const collections = ref<Collection[]>([])
  const success = ref(true)
  const evaluations: {id: string, name: string}[] = reactive([])
  const selectedEvaluation: {id: string, name: string} = reactive({id: '', name: ''})
  const exqURI = getMainURI()

  // global UI settings
  const themeId = ref<ThemeId>('graphiteDark')
  const lastDarkThemeId = ref<Exclude<ThemeId, 'light'>>('graphiteDark') 
  const globalThumbSize = ref<number>(220)

  return {
    selectedEvaluation,
    session,
    collections,
    success,
    evaluations,
    exqURI,

    // UI settings
    themeId,
    lastDarkThemeId,
    globalThumbSize,
  }
})