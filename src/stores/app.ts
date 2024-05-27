import { defineStore } from "pinia"

export const useAppStore = defineStore('app', () => {
    const session = ref('')
    const success = ref(true)

    const evalId = ref('ebdfcf4e-5ffd-4cde-8308-c872bbc28e51') 

    function setEvaluationId(s: string) {
        evalId.value = s
    }

    return {
        evalId,
        session,
        success,
        setEvaluationId
    }
})