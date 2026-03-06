import { searchImage, searchText } from '@/services/ExquisitorAPI'
import { ChatQuery, ExqSearchResponse } from '@/types/chat'
import { ExqImageSearchRequest, ExqTextSearchRequest } from '@/types/exq'
import { defineStore } from 'pinia'
import { useAppStore } from './app'
import { useModelStore } from './model'
import { useItemStore } from './item'
import { useFilterStore } from './filter'
import { ActiveFiltersDB, AppliedFilters } from '@/types/filter'
import { ILSets } from '@/types/mediaitem'

export const useChatStore = defineStore('chat', () => {
  const chatSessions = reactive<Map<number,ChatQuery[]>>(new Map<number,ChatQuery[]>())
  const currentQueryId = ref('')
  const modelStore = useModelStore()
  const appStore = useAppStore()
  const itemStore = useItemStore()
  
  function getOrCreateChat(modelId: number): ChatQuery[] {
    if (chatSessions.has(modelId)) {
      return chatSessions.get(modelId)!
    }
    chatSessions.set(
      modelId, 
      [],
    )
    return chatSessions.get(modelId)!
  } 
  
  async function search(
    modelId: number,
    queryName: string,
    queryText: string,
    current: boolean,
    searchType: string,
    searchModel: string,
    activeFilters: AppliedFilters = {},
    refresh: boolean,
    n?: number
  ): Promise<number[]> {
    let seen: number[] = []
    let query = queryText
    let qIdx = -1
    if (current) {
      qIdx = chatSessions.get(modelId)!.findIndex(
        (val) => val.id === currentQueryId.value 
      )
      seen = chatSessions.get(modelId)![qIdx].resultIds
      query = chatSessions.get(modelId)![qIdx].text
      searchType = chatSessions.get(modelId)![qIdx].searchType
      // searchModel = chatSessions.get(modelId)![qIdx].searchModel
    }
    let n_items = modelStore.activeModel!.settings.itemsToShow
    if (n !== undefined) {
      n_items = n
    }
    let exclude : number[] = itemStore.getSetItems(modelStore.activeModel!.id, ILSets.Excluded).map(item => item.id)
    let prepFilters: ActiveFiltersDB | undefined = useFilterStore().prepareFilters(
      modelStore.activeModel!.id, 
      activeFilters
    )
    
    if (Object.keys(activeFilters).length !== 0) {
      console.log(activeFilters)
      // prepFilters = useFilterStore().prepareFilters(modelStore.activeModel!.id, activeFilters)
    }
    let resultIds : ExqSearchResponse = { suggestions: [] }
    if (searchType === 'text') {
      let reqObj : ExqTextSearchRequest = {
        session_info: {
          session: appStore.session,
          collection: modelStore.activeModel!.collection,
          modelId: modelStore.activeModel!.id
        },
        n: n_items,
        text: query,
        seen: seen,
        filters: prepFilters,
        excluded: exclude,
        search_model: searchModel
      }
      resultIds = await searchText(reqObj).then((res) => {
        return res
      })
    } else if (searchType === 'image') {
      let reqObj : ExqImageSearchRequest = {
        session_info: {
          session: appStore.session,
          collection: modelStore.activeModel!.collection,
          modelId: modelStore.activeModel!.id
        },
        n: n_items,
        image_b64: query,
        seen: seen,
        filters: prepFilters,
        excluded: exclude,
        search_model: searchModel
      }
      resultIds = await searchImage(reqObj).then((res) => {
        return res
      })
    }
    console.log('resultIds:', resultIds.suggestions)
    if (!current) {
      const chat = chatSessions.get(modelId)
      chat!.push({
        id: generateUniqueId(),
        name: queryName,
        text: query,
        timestamp: Date.now(),
        resultIds: resultIds.suggestions,
        searchType: searchType,
        searchModel: searchModel,
        filters: activeFilters
      })
      currentQueryId.value = chat![chat!.length-1].id
      return resultIds.suggestions
    } else {
      if (!refresh) {
        console.log('Using old resultIds array')
        chatSessions.get(modelId)![qIdx].resultIds.push(...resultIds.suggestions)
      } else {
        console.log('New resultIds')
        chatSessions.get(modelId)![qIdx].resultIds = resultIds.suggestions
      }
      chatSessions.get(modelId)![qIdx].filters = activeFilters
      return chatSessions.get(modelId)![qIdx].resultIds
    }
  }
  
  return {
    chatSessions,
    currentQueryId,
    getOrCreateChat,
    search
  }
})

function generateUniqueId() {
  return crypto.randomUUID()
}
