// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { reactive } from "vue"
import { RFSession } from "@/types/feedback";
import { defineStore } from "pinia";
import { useItemStore } from "./item";
import { ILSets } from "@/types/mediaitem";
import { ExqRFRequest } from "@/types/exq";
import { useAppStore } from "./app";
import { useModelStore } from "./model";
import { searchRF } from "@/services/ExquisitorAPI";
import { ActiveFiltersDB } from "@/types/filter";

export const useFeedbackStore = defineStore('feedback', () => {
  const itemStore = useItemStore()
  const modelStore = useModelStore()
  const rfSearches = reactive<Map<number,RFSession>>(new Map<number,RFSession>())
  
  function getOrCreateRF(modelId: number): RFSession {
    if (rfSearches.has(modelId)) {
      return rfSearches.get(modelId)!
    }
    rfSearches.set(
      modelId,
      {
        positives: [],
        negatives: [],
        filters: undefined,
        resultIds: []
      }
    )
    return rfSearches.get(modelId)!
  } 
  
  function setRFModelFilters(filters: ActiveFiltersDB | undefined) {
    const activeModelId = modelStore.activeModel!.id
    const rfSearch = rfSearches.get(activeModelId!)
    rfSearch!.filters = filters
    rfSearches.set(activeModelId!, rfSearch!)
  }

  function getRFModelFilters(): ActiveFiltersDB | undefined {
    const activeModelId = modelStore.activeModel!.id
    const rfSearch = rfSearches.get(activeModelId!)
    return rfSearch!.filters
  }
  
  async function getFeedbackResults(
    loadMore: boolean, 
    query?: string,
  ): Promise<number[]> {
    const activeModelId = modelStore.activeModel!.id
    let pos: number[] = []
    let neg: number[] = []
    let resIds: number[] = []
    const rfSearch = rfSearches.get(activeModelId)!
    pos = itemStore.getSetItems(activeModelId, ILSets.Positives).map((e,_) => e.id)
    neg = itemStore.getSetItems(activeModelId, ILSets.Negatives).map((e,_) => e.id)
    if (loadMore) {
      pos = rfSearch.positives
      neg = rfSearch.negatives
      resIds = rfSearch.resultIds
    } else {
      rfSearch.positives = pos
      rfSearch.negatives = neg
      rfSearch.resultIds = []
    }
    let hist:number[] = []
    hist.push(...pos)
    hist.push(...neg)
    hist.push(...resIds)
    let exclude : number[] = []
    if (itemStore.getSetItems(activeModelId, ILSets.Excluded).length > 0) {
      exclude = itemStore.getSetItems(activeModelId, ILSets.Excluded).map(item => item.id)
    }
    let reqObj : ExqRFRequest = {
      session_info: {
        session: useAppStore().session, 
        modelId: activeModelId,
        collection: modelStore.getModelCollection(activeModelId)
      },
      n: modelStore.activeModel!.settings.itemsToShow,
      pos: pos,
      neg: neg,
      seen: hist,
      ...(rfSearch.filters !== undefined && { filters: rfSearch.filters }),
      excluded: exclude,
      query: query
    }
    // if (checkFilters.value) {
    //     let filters = useFilterStore().getModelFilters(activeModel.value.id)
    //     reqObj.filters = filters
    // }
    let suggs = await searchRF(reqObj)
    resIds.push(...suggs.suggestions)
    rfSearch.resultIds = resIds
    return resIds
  }
  
  return {
    getOrCreateRF,
    setRFModelFilters,
    getRFModelFilters,
    getFeedbackResults
  }
})