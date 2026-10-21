// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { searchTemporal } from "@/services/ExquisitorAPI"
import { ChatQuery } from "@/types/chat"
import { ExqTemporalHop, ExqTemporalSearchRequest } from "@/types/exq"
import { defineStore } from "pinia"
import { useAppStore } from "./app"
import { useModelStore } from "./model"
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
    let reqObj : ExqTemporalSearchRequest = {
      session_info: {
        session: useAppStore().session, 
        modelId: modelStore.activeModel!.id,
        collection: modelStore.getModelCollection(modelStore.activeModel!.id)
      },
      n: 100,
      hops: orderedSelection.map(toHop),
      excluded: [],
      seen: [],
    }

    const chains = await searchTemporal(reqObj).then((response) => {
      console.log("Temporal search results:", response.suggestions)
      loadingResults.value = false
      return response.suggestions
    })
    // The grid works on item ids so the chains are flattened in rank order
    const resultIds = [...new Set(chains.flatMap(c => c.items))]

    let text = orderedSelection[0].name + "," + orderedSelection[1].name
    if (orderedSelection.length > 2) {
      text += ", ..."
    }
    chat!.push({
      id: generateUniqueId(),
      name: "Temporal Search (" + text + ")",
      text: orderedSelection.map(q => q.text).join(" || "),
      timestamp: Date.now(),
      resultIds: resultIds,
      searchType: 'temporal',
      searchModel: 'clip',
      filters: orderedSelection[0].filters,
      chains: chains
    })
    chatStore.currentQueryId = chat![chat!.length-1].id
    // await new Promise(resolve => setTimeout(resolve, 5000)).then(() => {
    //     loadingResults.value = false
    // })
    
    return resultIds
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
  
// Image searches will map to kind 'query' and RF history entries to kind 'rf' here once they can be selected
function toHop(q: ChatQuery): ExqTemporalHop {
  return {
    kind: 'query',
    text: q.text,
    ...(q.indexName !== undefined && { index_name: q.indexName }),
    ...(q.filters !== undefined && { filters: q.filters }),
  }
}

function generateUniqueId() {
  return crypto.randomUUID()
}