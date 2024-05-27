import { Filter } from "@/types/filter"
import { useAppStore } from "@/stores/app"
import { defineStore } from "pinia"
import { getFilters, resetFilters } from "@/services/ExquisitorAPI"

export const useFilterStore = defineStore('filter', () => {
    const session = useAppStore().session
    const filters : Filter[] = reactive([])
    const filtersLoaded = ref(false)
    // K:modelId, V:[filterId -> values]
    const activeFilters : Map<number,number[][]> = 
        reactive(new Map<number, number[][]>())
    
    async function loadFilters(modelId: number) {
        // console.log('loadFilters('+modelId+')')
        if (activeFilters.has(modelId)) return
        if (filtersLoaded.value) {
            activeFilters.set(modelId, [])
            filters.forEach(_ => {
                activeFilters.get(modelId)!.push([])
            });
        } else {
            activeFilters.set(modelId, [])
            await getFilters().then((resp) => { 
                filtersLoaded.value = true
                filters.push(...resp.filters)
                filters.forEach(element => {
                    activeFilters.get(modelId)!.push([])
                });
            })
        }
        // console.log('filters:', filters)
    }
    
    function applyFilters(modelId: number, filterId: number, filterVals: number[]) {
        activeFilters.get(modelId)![filterId] = filterVals
        // const resp = await applyFilters({session: session, model: modelId, names: names, values: values})
        // console.log('addFilters (response):', resp)
    }

    function applyRangeFilters(modelId: number, filterId: number, values: [number, number]) {
        activeFilters.get(modelId)![filterId] = values
    }
    
    function clearFilters(modelId: number) {
        filters.forEach(element => {
            activeFilters.get(modelId)![element.id] = []
        });
        resetFilters({session: session, model: modelId})
    }

    function updateActiveFilters(modelId:number, setFilters:number[][]) {
        activeFilters.set(modelId, setFilters)
    }

    function getModelFilters(modelId: number) : number[][] {
        let filterVals : number[][] = []
        if (activeFilters.has(modelId))
            if (activeFilters.get(modelId)!.length > 0)
                filters.forEach(element => {
                    filterVals.push(activeFilters.get(modelId)![element.id])
                })
        return filterVals
    }

    function getFilterValues(modelId: number, filterId: number) {
        if (activeFilters.has(modelId)) {
            return activeFilters.get(modelId)!.length > 0 ? activeFilters.get(modelId)![filterId] : []
        }
        return []
    }

    return { 
        activeFilters,
        filters,
        filtersLoaded,
        loadFilters,
        applyFilters,
        applyRangeFilters,
        clearFilters,
        updateActiveFilters,
        getModelFilters,
        getFilterValues,
    }
})