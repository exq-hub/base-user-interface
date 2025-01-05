import { defineStore } from "pinia"
interface Collection {
    name: string
    description?: string
}

export const useAppStore = defineStore('app', () => {
    const session = ref('')
    const collections = ref<Collection[]>([])
    const success = ref(true)
    const evaluations: {id: string, name: string}[] = reactive([])
    const selectedEvaluation: {id: string, name: string} = reactive({id: '', name: ''})

    return {
        selectedEvaluation,
        session,
        collections,
        success,
        evaluations,
    }
})