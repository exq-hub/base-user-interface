// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  ActiveFiltersDB,
  AppliedFilters,
  DBRangeConstraint,
  FilterExpr,
  FilterGroup,
  FilterInfo,
  FilterLeaf,
  LogicalOp
} from "@/types/filter"
import { defineStore } from "pinia"
import { getFiltersInfo, getFilterValues } from "@/services/ExquisitorAPI"
import { useModelStore } from "./model"

export const useFilterStore = defineStore('filter', () => {
  const filterNameIdMap = reactive(new Map<string, Map<string, number>>())
  const filtersInfo = reactive(new Map<number, FilterInfo[]>())
  const filtersLoaded = ref(false)

  const nonFilterTagsets = [
    //"Start (ms)", "End (ms)",
    "CLIP Index ID",
    "Caption Index ID", "Transcript Index ID"
  ]

  const mainItemTagsets = ["Objects", "Time (hh:mm:ss)", "Video ID", "Hour", "Day", "Month", "Year"]
  const otherItemTagsets = ["Start (ms)", "End (ms)", "Keyframe (ms)"]
  const mainGroupTagsets = ["Title", "Categories", "User Tags"]
  const otherGroupTagsets = ["Resolution", "Duration (hh:mm:ss)"]

  function isMain(key: string) : boolean {
    return mainItemTagsets.includes(key) || mainGroupTagsets.includes(key)
  }

  // Tagset IDs for the given tagset names in a collection, skipping names it doesn't have
  function tagsetIds(collection: string, names: string[]): number[] {
    const nameIds = filterNameIdMap.get(collection)
    if (!nameIds) return []
    return names.map(n => nameIds.get(n)).filter((id): id is number => id !== undefined)
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
    // forEach would not wait for the values, so filtersLoaded was set before they arrived
    await Promise.all(filtersInfo.get(modelId)!.map(async (f) => {
      f.values = await getFilterValues(session, collection, f.tagtypeId, f.id)
    }))
    console.log(filtersInfo.get(modelId)!)
    filtersLoaded.value = true
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

  function toAppliedFilters(
    af: ActiveFiltersDB | undefined,
    filterInfos: FilterInfo[]
  ): AppliedFilters {
    const out: AppliedFilters = {}
    if (!af) return out

    const byId = new Map<number, FilterInfo>()
    for (const f of filterInfos) byId.set(f.id, f)

    const walk = (expr: FilterExpr) => {
      if (expr.kind === 'leaf') {
        const { id, constraint } = expr.filter
        if ('value_ids' in constraint) {
          const info = byId.get(id)
          if (info) out[id] = info.values.filter(v => (constraint.value_ids as number[]).includes(v.id))
        }
      } else if (expr.kind === 'group') {
        for (const child of (expr as FilterGroup).children) walk(child)
      }
    }
    walk(af.root)
    return out
  }

  return {
    filtersLoaded,
    filtersInfo,
    filterNameIdMap,
    tagsetIds,
    mainItemTagsets,
    otherItemTagsets,
    mainGroupTagsets,
    otherGroupTagsets,
    isMain,
    isGroup,
    loadFilters,
    toAppliedFilters,
    makeValueLeaf,
    makeRangeLeaf,
    makeGroup,
    makeActiveFilters,
  }
})
