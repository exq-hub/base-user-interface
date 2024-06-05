import { defineStore } from "pinia"

export const useAppStore = defineStore('app', () => {
    const session = ref('')
    const success = ref(true)

    const evalId = ref('') 

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