import type { ChatEntryQueryPos, ChatEntryQueryText } from "@/types/chat";
import { defineStore } from "pinia";
import { reactive } from "vue";

export const useConversationStore = defineStore('conversations', () => {
    const conversations : Map<number, (ChatEntryQueryText|ChatEntryQueryPos)[]> = reactive(new Map<number, (ChatEntryQueryText|ChatEntryQueryPos)[]>)

    function createConversation(modelId: number) : void {
        conversations.set(modelId,[])
    }

    function getConversation(modelId: number) : (ChatEntryQueryText|ChatEntryQueryPos)[] {
        if (conversations.has(modelId)) {
            return conversations.get(modelId)!
        } else {
            return []
        }
    }

    function addConversation(modelId: number, entry: ChatEntryQueryText|ChatEntryQueryPos) {
        conversations.get(modelId)!.push(entry)
    }

    return {
        createConversation,
        getConversation,
        addConversation
    }
})