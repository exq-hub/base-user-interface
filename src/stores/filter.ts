// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { ActiveFiltersDB, AppliedFilters, DBRangeConstraint, FilterExpr, FilterGroup, FilterInfo, FilterLeaf, FilterValue, LogicalOp } from "@/types/filter"
import { defineStore } from "pinia"
import { getFiltersInfo, getFilterValues } from "@/services/ExquisitorAPI"
import { useModelStore } from "./model"

export const useFilterStore = defineStore('filter', () => {
  const filterNameIdMap = reactive(new Map<string, Map<string, number>>())
  const filtersInfo = reactive(new Map<number, FilterInfo[]>())
  const filtersLoaded = ref(false)
  
  const nonFilterTagsets = [
    "Start (ms)", "End (ms)", "CLIP Index ID", 
    "Caption Index ID", "Transcript Index ID"
  ]
  
  const mainItemTagsets = ["Objects", "Time (hh:mm:ss)", "Video ID"]
  const otherItemTagsets = ["Start (ms)", "End (ms)", "Keyframe (ms)"]
  const mainGroupTagsets = ["Title", "Categories", "User Tags"]
  const otherGroupTagsets = ["fps", "Resolution", "Duration (hh:mm:ss)"]
  
  function isMain(key: string) : boolean {
    return mainItemTagsets.includes(key) || mainGroupTagsets.includes(key)
  }
  
  function isGroup(key: string) : boolean {
    return mainGroupTagsets.includes(key) || otherGroupTagsets.includes(key)
  }
  
  // Load filters
  
  async function loadFilters(session: string, modelId: number) {
    // console.log('loadFilters('+modelId+')')
    if (filtersInfo.has(modelId)) return
    
    filtersInfo.set(modelId, [])
    let collection = useModelStore().getModelCollection(modelId)
    await getFiltersInfo(session, collection)
    .then((resp: FilterInfo[]) => { 
      resp.forEach((f) => {
        if (!filterNameIdMap.has(collection)) {
          filterNameIdMap.set(collection, new Map<string, number>())
        }
        if (!filterNameIdMap.get(collection)!.has(f.name)) {
          filterNameIdMap.get(collection)!.set(f.name, f.id)
        }
        if (nonFilterTagsets.find((t) => t === f.name) === undefined 
        && !filtersInfo.get(modelId)!.find((existingF) => existingF.id === f.id)
        && !f.name.includes('JSON') && !f.name.includes('Index')) {
          filtersInfo.get(modelId)!.push(f)
        }
      })
    })
    await filtersInfo.get(modelId)!.forEach(async (f) => {
      await getFilterValues(session, useModelStore().getModelCollection(modelId), f.tagtypeId, f.id)
      .then((vals: FilterValue[]) => { 
        f.values = vals
      })
    }) 
    console.log(filtersInfo.get(modelId)!)
    filtersLoaded.value = true
  }
  
  function prepareFilters(
    modelId: number,
    appliedFilters: AppliedFilters
  ) : ActiveFiltersDB | undefined {
    const mFilters = filtersInfo.get(modelId)!
    let prepFilters = {} as FilterExpr
    // Check if any filters are applied
    let anyFilterApplied = false
    mFilters.forEach((filter) => {
      if (appliedFilters[filter.id] && appliedFilters[filter.id].length > 0) {
        anyFilterApplied = true
      }
    })
    if (!anyFilterApplied) {
      return undefined
    }
    // Build filter expression tree
    const children: FilterExpr[] = []
    mFilters.forEach((filter) => {
      if (appliedFilters[filter.id] && appliedFilters[filter.id].length > 0) {
        const valIds: number[] = []
        appliedFilters[filter.id].forEach((element) => {
          valIds.push(element.id)
        })
        const leaf = makeValueLeaf(
          filter.id,
          filter.tagtypeId,
          valIds,
          "OR",
          false
        )
        children.push(leaf)
      }
    })
    prepFilters = makeGroup(
      "AND",
      children,
      false
    )
    return makeActiveFilters(prepFilters)
  }
  
  
  
  // Builders
  
  /**
  * Make a leaf node with value constraint (ANY/ALL semantics)
  */
  function makeValueLeaf(
    id: number,
    tagtype_id: number,
    valueIds: number[],
    operator: LogicalOp = "OR",
    not_: boolean = false
  ): FilterLeaf {
    return {
      kind: "leaf",
      not_,
      filter: {
        id,
        tagtype_id,
        constraint: {
          value_ids: valueIds,
          operator,
        },
      },
    };
  }
  
  /**
  * Make a leaf node with numeric/string range constraint
  */
  function makeRangeLeaf(
    id: number,
    tagtype_id: number,
    lower: number | string | null = null,
    upper: number | string | null = null,
    not_: boolean = false
  ): FilterLeaf {
    const constraint: DBRangeConstraint = {};
    if (lower !== null && lower !== undefined) constraint.lower_bound = lower;
    if (upper !== null && upper !== undefined) constraint.upper_bound = upper;
    
    return {
      kind: "leaf",
      not_,
      filter: {
        id,
        tagtype_id,
        constraint,
      },
    };
  }
  
  /**
  * Make a logical group (AND/OR)
  */
  function makeGroup(
    operator: LogicalOp = "AND",
    children: FilterExpr[] = [],
    not_: boolean = false
  ): FilterGroup {
    return {
      kind: "group",
      operator,
      not_,
      children,
    };
  }
  
  /**
  * Wrap the root expression into an ActiveFiltersDB object
  */
  function makeActiveFilters(root: FilterExpr): ActiveFiltersDB {
    return { root };
  }
  
  // (Optional) Type guards:
  
  // export const isLeaf = (n: FilterExpr): n is FilterLeaf => n.kind === "leaf";
  // export const isGroup = (n: FilterExpr): n is FilterGroup => n.kind === "group";   
  
  return {
    filtersLoaded,
    filtersInfo,
    filterNameIdMap,
    mainItemTagsets,
    otherItemTagsets,
    mainGroupTagsets,
    otherGroupTagsets,
    isMain,
    isGroup,
    loadFilters,
    prepareFilters,
    makeValueLeaf,
    makeRangeLeaf,
    makeGroup,
    makeActiveFilters,
  }
})