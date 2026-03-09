// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { searchTemporal } from "@/services/ExquisitorAPI"
import { ChatQuery } from "@/types/chat"
import { ExqTemporalSearchRequest } from "@/types/exq"
import { defineStore } from "pinia"
import { useAppStore } from "./app"
import { useModelStore } from "./model"
import { ActiveFiltersDB } from "@/types/filter"
import { useFilterStore } from "./filter"
import { useChatStore } from "./chat"

export const useTemporalSearchStore = defineStore('temporalSearch', () => {
  const isOpen = ref(false)
  const temporalSelection = ref<ChatQuery[]>([])
  const loadingResults = ref(false)
  
  const modelStore = useModelStore()
  const chatStore = useChatStore()
  
  function open(tempSelection: ChatQuery[]) {
    temporalSelection.value = tempSelection
    isOpen.value = true
    loadingResults.value = false
  }
  
  function close() {
    isOpen.value = false
  }
  
  async function search(orderedSelection: ChatQuery[]) {
    loadingResults.value = true
    const chat = chatStore.chatSessions.get(modelStore.activeModel!.id)
    if (
      chat!.find((c) => (
        c.text === orderedSelection.map(q => q.text).join(" || ") &&
        c.filters === orderedSelection[0].filters
      ))) {
        // Duplicate search, do not perform
        loadingResults.value = false
        isOpen.value = false
        return
    }

    // Implement the search logic here using the orderedSelection
    console.log("Searching with ordered selection:", orderedSelection)
    let prepFilters: (ActiveFiltersDB | undefined)[] = []
    for (const f of orderedSelection) {
      if (Object.keys(f.filters).length > 0) {
        prepFilters.push(useFilterStore().prepareFilters(modelStore.activeModel!.id, f.filters))
      }
    }
    let reqObj : ExqTemporalSearchRequest = {
      session_info: {
        session: useAppStore().session, 
        modelId: modelStore.activeModel!.id,
        collection: modelStore.getModelCollection(modelStore.activeModel!.id)
      },
      n: 100,
      queries: orderedSelection.map(q => q.text),
      filters: prepFilters,
      excluded: [],
      seen: [],
    }

    let resultIds = await searchTemporal(reqObj).then((response) => {
      console.log("Temporal search results:", response.suggestions)
      loadingResults.value = false
      return response
    })
    
    let text = orderedSelection[0].name + "," + orderedSelection[1].name
    if (orderedSelection.length > 2) {
      text += ", ..."
    }
    chat!.push({
      id: generateUniqueId(),
      name: "Temporal Search (" + text + ")",
      text: orderedSelection.map(q => q.text).join(" || "),
      timestamp: Date.now(),
      resultIds: resultIds.suggestions,
      searchType: 'temporal',
      searchModel: 'clip',
      filters: orderedSelection[0].filters
    })
    chatStore.currentQueryId = chat![chat!.length-1].id
    // await new Promise(resolve => setTimeout(resolve, 5000)).then(() => {
    //     loadingResults.value = false
    // })
    
    return resultIds.suggestions
  }
    
  return {
    isOpen,
    temporalSelection,
    loadingResults,
    open,
    close,
    search
  }
})
  
function generateUniqueId() {
  return crypto.randomUUID()
}