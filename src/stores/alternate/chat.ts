import { ChatSession } from '@/types/chat'
import { defineStore } from 'pinia'

export const useChatStore = defineStore('chat', () => {
    const chatSessions = reactive<Map<number,ChatSession>>(new Map<number,ChatSession>())
    const currentResultsQuery = ref('')

    function getOrCreateChat(modelId: number): ChatSession {
        if (chatSessions.has(modelId)) {
            return chatSessions.get(modelId)!
        }
        chatSessions.set(
            modelId, 
            {
                queries: [],
                positiveSelections: new Set(),
                negativeSelections: new Set(),
                filters: {},
            }
        )
        return chatSessions.get(modelId)!
    }

    function addQueryToChat(modelId: number, queryText: string, resultIds: number[]) {
        const chat = chatSessions.get(modelId)
        if (!chat) return
        chat.queries.push({
            id: generateUniqueId(),
            text: queryText,
            timestamp: Date.now(),
            resultIds,
        })
        currentResultsQuery.value = queryText
   }

    function markItem(modelId: number, itemId: string, isPositive: boolean) {
        const chat = chatSessions.get(modelId)
        if (!chat) return

        if (isPositive) {
            chat.positiveSelections.add(itemId)
            chat.negativeSelections.delete(itemId)
        } else {
            chat.negativeSelections.add(itemId)
            chat.positiveSelections.delete(itemId)
        }
    }

    return {
        chatSessions,
        currentResultsQuery,
        getOrCreateChat,
        addQueryToChat,
        markItem,
    }
})

// Simple unique ID generator for demonstration
function generateUniqueId() {
    return Math.random().toString(36).substr(2, 9)
}
