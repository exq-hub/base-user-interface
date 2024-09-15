import { Filter, FilterType } from "@/types/filter"
import { useAppStore } from "@/stores/app"
import { defineStore } from "pinia"
import { getFilters, resetFilters } from "@/services/ExquisitorAPI"

export const useFilterStore = defineStore('filter', () => {
    const session = useAppStore().session
    const filters : Filter[] = reactive([])
    const filtersLoaded = ref(false)
    // K:modelId, V:[filterId -> values]
    const activeFilters : Map<number, (number | string)[][]> = 
        reactive(new Map<number, (number|string)[][]>())
    
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
            await getFilters(useAppStore().session).then((resp) => { 
                filtersLoaded.value = true
                filters.push(...resp.filters)
                filters.forEach(_ => {
                    activeFilters.get(modelId)!.push([])
                });
            })
        }
        // console.log('filters:', filters)
    }
    
    function applyFilters(modelId: number, filterId: number, filterVals: (number|string)[]) {
        activeFilters.get(modelId)![filterId] = filterVals
        // const resp = await applyFilters({session: session, model: modelId, names: names, values: values})
        // console.log('addFilters (response):', resp)
    }

    function updateActiveFilters(modelId:number, setFilters: (number|string)[][]) {
        console.log(modelId, setFilters)
        activeFilters.set(modelId, setFilters)
    }

    function clearFilters(modelId: number) {
        filters.forEach(element => {
            activeFilters.get(modelId)![element.id] = []
        });
        resetFilters({session: session, modelId: modelId})
    }

    function getModelFilters(modelId: number) : { names: string[], values: (number|string)[][] } {
        let filterObj : { names: string[], values: (number|string)[][] } = { names: [], values: []}
        if (activeFilters.has(modelId)) {
            const modelFilters = activeFilters.get(modelId)!
            console.log('modelFilters', modelFilters)
            filters.forEach(element => {
                if (modelFilters[element.id].length > 0) {
                    filterObj.names.push(element.name)
                    filterObj.values.push(modelFilters[element.id])
                }
            })
        }
        console.log(filterObj)
        return filterObj
    }

    function getFilterValues(modelId: number, filterId: number) : number[] | string[] | (string|number)[] {
        if (activeFilters.has(modelId)) {
            if (filters[filterId].filterType === FilterType.Single || filters[filterId].filterType === FilterType.Multi)
                return activeFilters.get(modelId)![filterId] as number[] | string[]
            if (filters[filterId].filterType === FilterType.RangeNumber || filters[filterId].filterType === FilterType.RangeNumberMulti)
                return activeFilters.get(modelId)![filterId] as number[]
            if (filters[filterId].filterType === FilterType.Count || filters[filterId].filterType === FilterType.CountMulti)
                return activeFilters.get(modelId)![filterId] as number[]
            if (filters[filterId].filterType === FilterType.RangeLabel || filters[filterId].filterType === FilterType.RangeLabelMulti)
                return activeFilters.get(modelId)![filterId] as (string | number)[]
        }
        return []
    }

    return { 
        activeFilters,
        filters,
        filtersLoaded,
        loadFilters,
        applyFilters,
        clearFilters,
        updateActiveFilters,
        getModelFilters,
        getFilterValues,
    }
})