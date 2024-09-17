import { defineStore } from "pinia"

export const useAppStore = defineStore('app', () => {
    const session = ref('')
    const success = ref(true)
    const evaluations: {id: string, name: string}[] = reactive([])
    const selectedEvaluation: {id: string, name: string} = reactive({id: '', name: ''})

    return {
        selectedEvaluation,
        session,
        success,
        evaluations,
    }
})