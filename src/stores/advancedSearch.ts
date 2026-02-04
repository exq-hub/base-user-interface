import { AdvancedSearchPayload } from "@/types/chat"
import { defineStore } from "pinia"
import { useFeedbackStore } from "./feedback"
import { AppliedFilters } from "@/types/filter"

export const useAdvancedSearchStore = defineStore('advancedSearch', () => {
    const isOpen = ref(false)
    const payload = ref<AdvancedSearchPayload>({
        queryName: '',
        queryText: '',
        searchType: 'text',
        searchModel: 'clip',
        filters: {} as AppliedFilters,
    })
    
    const performChatSearch = ref<boolean>(false)
    const performRFSearch = ref<boolean>(false)

    function open(next: AdvancedSearchPayload) {
        payload.value = next
        isOpen.value = true
    }

    function close() {
        isOpen.value = false
    }

    function applyChanges(next: AdvancedSearchPayload) {
        console.log('Applying changes with payload:', next)
        if (payload.value.searchType === 'feedback') {
            payload.value = { ...payload.value, ...next }
            useFeedbackStore().setRFModelFilters(next.filters)
            performRFSearch.value = true
        } else {
            payload.value = { ...payload.value, ...next }
            performChatSearch.value = true
        }
        isOpen.value = false
    }

    return { 
        isOpen,
        payload,
        performChatSearch,
        performRFSearch,
        open,
        close,
        applyChanges 
    }
})