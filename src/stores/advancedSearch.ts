// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { ref } from "vue"
import { AdvancedSearchPayload } from "@/types/chat"
import { defineStore } from "pinia"
import { AppliedFilters } from "@/types/filter"

export const useAdvancedSearchStore = defineStore('advancedSearch', () => {
  const isOpen = ref(false)

  const payload = ref<AdvancedSearchPayload>({
    queryName: '',
    queryText: '',
    searchType: 'text',
    searchModel: 'clip',
    filters: {} as AppliedFilters,
    history: false,
  } as any)

  function open(next: AdvancedSearchPayload) {
    payload.value = next
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return { isOpen, payload, open, close }
})