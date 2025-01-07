import { searchVLM } from '@/services/ExquisitorAPI'
import { ChatSession } from '@/types/chat'
import { ExqTextSearchRequest } from '@/types/exq'
import { defineStore } from 'pinia'
import { useAppStore } from './app'
import { useModelStore } from './model'

export const useChatStore = defineStore('chat', () => {
    const chatSessions = reactive<Map<number,ChatSession>>(new Map<number,ChatSession>())
    const currentResultsQuery = ref('')
    const modelStore = useModelStore()
    const appStore = useAppStore()

    function getOrCreateChat(modelId: number): ChatSession {
        if (chatSessions.has(modelId)) {
            return chatSessions.get(modelId)!
        }
        chatSessions.set(
            modelId, 
            {
                queries: [],
                filters: {},
            }
        )
        return chatSessions.get(modelId)!
    } 

    async function search(modelId: number, queryText: string, current: boolean) {
        // loading.value = true
        let seen: number[] = []
        let qIdx = -1
        if (current) {
            qIdx = chatSessions.get(modelId)!.queries.findIndex((val) => val.text === queryText)
            seen = chatSessions.get(modelId)!.queries[qIdx].resultIds
        }
        let reqObj : ExqTextSearchRequest = {
            session_info: {
                session: appStore.session,
                collection: modelStore.activeModel!.collection,
                modelId: modelStore.activeModel!.id
            },
            n: modelStore.activeModel!.settings.itemsToShow,
            text: queryText,
            seen: seen,
            filters: {
                names: [],
                values: []
            },
            excluded: []
        }
        // if (checkFilters.value) {
            // let filters = useFilterStore().getModelFilters(modelStore.activeModel!.id)
            // reqObj.filters = filters
        // }
        // if (checkHistory.value) {
        //     let pos = itemStore.getSetItems(activeModel.value.id, ILSets.Positives).map((e,_) => e.id)
        //     let neg = itemStore.getSetItems(activeModel.value.id, ILSets.Negatives).map((e,_) => e.id)
        //     let hist = itemStore.getSetItems(activeModel.value.id, ILSets.History).map((e,_) => e.id)
        //     hist.push(...pos)
        //     hist.push(...neg)
        //     hist.push(...activeModel.value.grid[0].items)
        //     reqObj.seen = hist
        // }
        const resultIds = await searchVLM(reqObj).then((res) => {
            // loading.value = false
            // loaded.value = true
            return res
        })
        console.log('resultIds:', resultIds.vlmResults)
        if (!current) {
            const chat = chatSessions.get(modelId)
            chat!.queries.push({
                id: generateUniqueId(),
                text: queryText,
                timestamp: Date.now(),
                resultIds: resultIds.vlmResults
            })
            currentResultsQuery.value = queryText
            return resultIds.vlmResults
        } else {
            chatSessions.get(modelId)!.queries[qIdx].resultIds.push(...resultIds.vlmResults)
            return chatSessions.get(modelId)!.queries[qIdx].resultIds
        }
    }

    return {
        chatSessions,
        currentResultsQuery,
        getOrCreateChat,
        search
    }
})

function generateUniqueId() {
    return Math.random().toString(36)
}
