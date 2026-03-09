// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { GroupMetadata, ILSets, } from "@/types/mediaitem";
import type MediaItem from "@/types/mediaitem";
import { defineStore } from "pinia";
import { reactive } from "vue";
import { getItem, getItemInfo, getRelatedItems } from "@/services/ExquisitorAPI";
import { useAppStore } from "@/stores/app";
import { useModelStore } from "./model";
import { useFilterStore } from "./filter";
// import { getItem } from "@/services/MockExquisitorAPI";

export const useItemStore = defineStore('item', () => {
  // K = ItemId, V = MediaItem
  const items : Map<string, Map<number, MediaItem>> = reactive(new Map<string, Map<number,MediaItem>>())
  // K = groupId, V = GroupMetdata
  const groupMetadata : Map<number, GroupMetadata> = reactive(new Map<number, GroupMetadata>())
  // K = modelId, V = Set<ItemId>
  const modelItems : Map<number, Set<number>> = reactive(new Map<number,Set<number>>())
  // modelId -> set -> (itemId -> addedAt)
  const setAddedAt = shallowReactive(new Map<number, Map<ILSets, Map<number, number>>>())
  
  const modelStore = useModelStore()
  const activeModel = reactive(computed(() => modelStore.activeModel))
  
  const selectedItem : Map<number, MediaItem> = reactive(new Map<number, MediaItem>())
  const selectedGroup : Map<number, GroupMetadata> = reactive(new Map<number, GroupMetadata>())
  
  const pendingControllers = new Map<string, AbortController>()
  
  const filterStore = useFilterStore()
  const appStore = useAppStore()
  
  async function fetchMediaItem(itemId: number, modelId: number) : Promise<MediaItem> {
    const collection = modelStore.getModelCollection(modelId)
    if (modelItems.has(modelId)) {
      modelItems.get(modelId)!.add(itemId)
    } else {
      modelItems.set(modelId, new Set<number>())
      modelItems.get(modelId)!.add(itemId)
    }
    
    if (!items.has(collection)) {
      items.set(collection, new Map<number, MediaItem>())
    }
    if (items.get(collection)!.has(itemId)) {
      // console.log('Fetching media item ' + itemId + ' from memory')
      if (!items.get(collection)!.get(itemId)!.currentSets!.has(modelId)) {
        items.get(collection)!.get(itemId)!.currentSets!.set(modelId, [false,false,false,false])
      }
      return items.get(collection)!.get(itemId)! // '!' Non-null
    } else {
      const key = `${collection}/${modelId}/${itemId}`
      const ctrl = new AbortController()
      pendingControllers.set(key, ctrl)
      // console.log('Fetching media item ' + itemId + ' from API')
      try {
        const item = await getItem(
          appStore.session, 
          itemId, modelId, 
          modelStore.getModelCollection(modelId),
          { signal: ctrl.signal }
        )
        items.get(collection)!.set(itemId, item)
        // console.log('itemId', items.get(collection)!.get(itemId))
        return item
      } finally {
        pendingControllers.delete(key)
      }
    }
  }
  
  async function fetchMediaItems(itemIds: number[], modelId: number, collection: string) : Promise<MediaItem[]> {
    if (!items.has(collection)) items.set(collection, new Map<number, MediaItem>())
      if (!modelItems.has(modelId)) modelItems.set(modelId, new Set<number>())
        
    // Track model items
    itemIds.forEach(id => modelItems.get(modelId)!.add(id))
    
    const colMap = items.get(collection)!
    const missing = itemIds.filter(id => !colMap.has(id))
    if (missing.length > 0) {
      // TODO (future batch endpoint):
      // Replace Promise.all below with a single API call that accepts an array of ids:
      // const batch = await getItems(appStore.session, missing, modelId, collection)
      // for (const it of batch) colMap.set(it.id, it)
      
      const fetched = await Promise.all(
        missing.map(id => getItem(appStore.session, id, modelId, collection))
      )
      for (const it of fetched) colMap.set(it.id, it)
      }
    
    // Ensure currentSets entry exists for this model
    for (const id of itemIds) {
      const it = colMap.get(id)!
      if (!it.currentSets) it.currentSets = new Map()
        if (!it.currentSets.has(modelId)) it.currentSets.set(modelId, [false, false, false, false])
        }
    
    return itemIds.map(id => colMap.get(id)!)
  }
  
  function ensureItemSetEntry(exqId: number, modelId: number) {
    const collection = modelStore.getModelCollection(modelId)
    const it = items.get(collection)?.get(exqId)
    if (!it) return // or throw, or fetch synchronously (not recommended)
    
    if (!it.currentSets) it.currentSets = new Map()
      if (!it.currentSets.has(modelId)) it.currentSets.set(modelId, [false, false, false, false])
  }
  
  function addItemToSet(itemId: number, modelId: number, ilset: ILSets) : void {
    // When adding an item to a set, we need to ensure it is removed from any mutually exclusive sets 
    // and update the addedAt timestamp for the set
    const now = Date.now()
    const map = setAddedAtMap(modelId, ilset)
    if (!map.has(itemId)) map.set(itemId, now)

    if (ilset === ILSets.Positives) {
      setAddedAtMap(modelId, ILSets.Negatives).delete(itemId)
      setAddedAtMap(modelId, ILSets.History).delete(itemId)
    } else if (ilset === ILSets.Negatives) {
      setAddedAtMap(modelId, ILSets.Positives).delete(itemId)
      setAddedAtMap(modelId, ILSets.History).delete(itemId)
    } else if (ilset === ILSets.History) {
      setAddedAtMap(modelId, ILSets.Positives).delete(itemId)
      setAddedAtMap(modelId, ILSets.Negatives).delete(itemId)
    } 

    // console.log('Adding Item:', itemId, 'to set', ilset, 'for model', modelId)
    const collection = modelStore.getModelCollection(modelId)
    ensureItemSetEntry(itemId, modelId)
    const sets = items.get(collection)!.get(itemId)!.currentSets!.get(modelId)!
    switch (ilset) {
      case ILSets.Positives:
        sets[ILSets.Positives] = true
        sets[ILSets.Negatives] = false
        sets[ILSets.History] = false
        return
      case ILSets.Negatives:
        sets[ILSets.Positives] = false
        sets[ILSets.Negatives] = true
        sets[ILSets.History] = false
        return
      case ILSets.History:
        sets[ILSets.Positives] = false
        sets[ILSets.Negatives] = false
        sets[ILSets.History] = true
        return
      case ILSets.Submitted:
        sets[ILSets.Submitted] = true
        return
      default:
        sets[ilset] = true
    }     
  }
  
  function addItemsToSet(itemIds: number[], modelId: number, ilset: ILSets) : boolean {
    const collection = modelStore.getModelCollection(modelId)
    itemIds.forEach((v,_) => {
      items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset] = true 
      if (!items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset]) {
        // console.log('Unable to add set to item: ' + ilset + ' ' + v)
        return false
      }
    })
    return true
  } 
  
  function removeItemFromSet(itemId: number, modelId: number, ilset: ILSets) : void {
    const collection = modelStore.getModelCollection(modelId)
    items.get(collection)!.get(itemId)!.currentSets!.get(modelId)![ilset] = false
    setAddedAtMap(modelId, ilset).delete(itemId)
  }
  
  function removeItemsFromSet(itemIds: number[], modelId: number, ilset: ILSets) : boolean {
    const collection = modelStore.getModelCollection(modelId)
    itemIds.forEach((v,_) => {
      items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset] = false
      if (items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset]) {
        // console.log('Unable to delete set from item: ' + ilset + ' ' + v)
        return false
      }
    })
    return true
  }
  
  function removeModelFromItems(modelId: number) : void {
    const collection = modelStore.getModelCollection(modelId)
    items.get(collection)!.forEach(item => item.currentSets!.delete(modelId))
  }
  
  function isItemInPos(itemId: number, modelId: number) : boolean {
    const collection = modelStore.getModelCollection(modelId)
    if (!items.has(collection)) return false
    if (!items.get(collection)!.has(itemId)) return false
    if (!items.get(collection)!.get(itemId)!.currentSets!.has(modelId)) return false
    return items.get(collection)!.get(itemId)!.currentSets!.get(modelId)![ILSets.Positives]
  }
  
  function isItemInNeg(itemId: number, modelId: number) : boolean {
    const collection = modelStore.getModelCollection(modelId)
    if (!items.has(collection)) return false
    if (!items.get(collection)!.has(itemId)) return false
    if (!items.get(collection)!.get(itemId)!.currentSets!.has(modelId)) return false
    return items.get(collection)!.get(itemId)!.currentSets!.get(modelId)![ILSets.Negatives]
  }
  
  function isItemInHistory(itemId: number, modelId: number) : boolean {
    const collection = modelStore.getModelCollection(modelId)
    if (!items.has(collection)) return false
    if (!items.get(collection)!.has(itemId)) return false
    if (!items.get(collection)!.get(itemId)!.currentSets!.has(modelId)) return false
    return items.get(collection)!.get(itemId)!.currentSets!.get(modelId)![ILSets.History]
  }
  
  function isItemInSubmitted(itemId: number, modelId: number) : boolean {
    const collection = modelStore.getModelCollection(modelId)
    if (!items.has(collection)) return false
    if (!items.get(collection)!.has(itemId)) return false
    if (!items.get(collection)!.get(itemId)!.currentSets!.has(modelId)) return false
    return items.get(collection)!.get(itemId)!.currentSets!.get(modelId)![ILSets.Submitted]
  }
  
  function getSetItems(modelId: number, set: ILSets): MediaItem[] {
    const collection = modelStore.getModelCollection(modelId)
    
    const colMap = items.get(collection)
    const mItems = modelItems.get(modelId)
    
    if (!colMap || !mItems) return []
    
    const setItems: MediaItem[] = []
    const times = setAddedAtMap(modelId, set)
    
    mItems.forEach((id) => {
      const it = colMap.get(id)
      if (!it) return
      
      const sets = it.currentSets?.get(modelId)
      if (!sets) return
      
      if (sets[set]) {
        if (sets && sets[set] && !times.has(it.id)) times.set(it.id, 0)
        setItems.push(it)
      }
    })
  
    setItems.sort((a, b) => (times.get(b.id) ?? 0) - (times.get(a.id) ?? 0))
    return setItems
  }

  async function fetchItemInfo(modelId: number, itemId: number): Promise<Record<string, number | string | (number | string)[]>> {
    const collection = modelStore.getModelCollection(modelId)
    let item_filter_ids : number[] = []
    const mainTagsets = filterStore.mainItemTagsets
    const otherTagsets = filterStore.otherItemTagsets
    // Get filter IDs for main and other item metadata
    for (let i = 0; i < mainTagsets.length; i++) {
      if (filterStore.filterNameIdMap.has(collection) && filterStore.filterNameIdMap.get(collection)!.has(mainTagsets[i])) {
        item_filter_ids.push(filterStore.filterNameIdMap.get(collection)!.get(mainTagsets[i])!)
      }
    }
    for (let i = 0; i < otherTagsets.length; i++) {
      if (filterStore.filterNameIdMap.has(collection) && filterStore.filterNameIdMap.get(collection)!.has(otherTagsets[i])) {
        item_filter_ids.push(filterStore.filterNameIdMap.get(collection)!.get(otherTagsets[i])!)
      }
    }
    // console.log('item_filter_ids:', item_filter_ids)
    
    // Fetch metadata
    let metadata = await getItemInfo(appStore.session, modelId, itemId, collection, item_filter_ids)
    items.get(collection)!.get(itemId)!.metadata = {}
    
    // Populate main and other item/group metadata
    for (let i = 0; i < filterStore.mainItemTagsets.length; i++) {
      if (metadata[filterStore.mainItemTagsets[i]] !== undefined) {
        items.get(collection)!.get(itemId)!.metadata![filterStore.mainItemTagsets[i]] = metadata[filterStore.mainItemTagsets[i]]
      }
    }
    for (let i = 0; i < filterStore.otherItemTagsets.length; i++) {
      if (metadata[filterStore.otherItemTagsets[i]] !== undefined) {
        items.get(collection)!.get(itemId)!.metadata![filterStore.otherItemTagsets[i]] = metadata[filterStore.otherItemTagsets[i]]
      }
    }
    return items.get(collection)!.get(itemId)!.metadata!
  }

  async function fetchGroupInfo(modelId: number, groupId: number): Promise<GroupMetadata> {
    const collection = modelStore.getModelCollection(modelId)
    if (groupMetadata.has(groupId)) {
      return groupMetadata.get(groupId)!
    }
    
    const mainTagsets = filterStore.mainGroupTagsets
    const otherTagsets = filterStore.otherGroupTagsets
    
    let group_filter_ids : number[] = []
    // Get filter IDs for group metadata
    for (let i = 0; i < mainTagsets.length; i++) {
      if (filterStore.filterNameIdMap.has(collection) && filterStore.filterNameIdMap.get(collection)!.has(mainTagsets[i])) {
        group_filter_ids.push(filterStore.filterNameIdMap.get(collection)!.get(mainTagsets[i])!)
      }
    }
    
    for (let i = 0; i < otherTagsets.length; i++) {
      if (filterStore.filterNameIdMap.has(collection) && filterStore.filterNameIdMap.get(collection)!.has(otherTagsets[i])) {
        group_filter_ids.push(filterStore.filterNameIdMap.get(collection)!.get(otherTagsets[i])!)
      }
    }
    
    // Initialize group metadata entry if not present
    if (!groupMetadata.has(groupId)) {
      let groupInfo =  await fetchMediaItem(groupId, modelId)
      groupMetadata.set(groupId, {
        src: groupInfo.srcPath,
        groupMediaType: groupInfo.mediaType,
        items: [],
        metadata: {}
      })
    }
    
    // Fetch metadata
    let metadata = await getItemInfo(appStore.session, modelId, groupId, collection, group_filter_ids)
    if (Object.keys(metadata).length === 0) {
      // No metadata found
      return groupMetadata.get(groupId)!
    }
    
    for (let i = 0; i < filterStore.mainGroupTagsets.length; i++) {
      if (metadata[filterStore.mainGroupTagsets[i]] !== undefined) {
        groupMetadata.get(groupId)!
        .metadata[filterStore.mainGroupTagsets[i]] = metadata[filterStore.mainGroupTagsets[i]]
      }
    }
    for (let i = 0; i < filterStore.otherGroupTagsets.length; i++) {
      if (metadata[filterStore.otherGroupTagsets[i]] !== undefined) {
        groupMetadata.get(groupId)!
        .metadata[filterStore.otherGroupTagsets[i]] = metadata[filterStore.otherGroupTagsets[i]]
      }
    }
    return groupMetadata.get(groupId)!
  }

  async function fetchRelatedItems(modelId: number, groupId: number): Promise<number[]> {
    const collection = modelStore.getModelCollection(modelId)
    if (groupMetadata.has(groupId) && groupMetadata.get(groupId)!.items.length > 0) {
      return groupMetadata.get(groupId)!.items
    }
    let relatedItems = await getRelatedItems(appStore.session, modelId, groupId, collection)
    groupMetadata.get(groupId)!.items = relatedItems
    return relatedItems
  }

  async function setSelectedItem(itemId: number) {
    if (activeModel.value) {
      const collection = modelStore.getModelCollection(activeModel.value.id)
      let item = items.get(collection)!.get(itemId)!
      let groupId = 0
      if (item.metadata === undefined) {
        item.metadata = await fetchItemInfo(activeModel.value!.id, item.id)
      }
      if (!groupMetadata.has(item.groupId!)) {
        await fetchGroupInfo(activeModel.value!.id, item.groupId!)
      }
      if (groupMetadata.get(item.groupId!)!.items === undefined || groupMetadata.get(item.groupId!)!.items.length === 0) {
        await fetchRelatedItems(activeModel.value!.id, item.groupId!)
        if (groupMetadata.get(item.groupId!)!.items.length > 0) {
          for (let i = 0; i < groupMetadata.get(item.groupId!)!.items.length; i++) {
            if (groupMetadata.get(item.groupId!)!.items[i] === item.id) {
              groupId = i
              break
            }
          }
        }
      }
      selectedItem.set(activeModel.value.id, items.get(collection)!.get(itemId)!)
      selectedGroup.set(activeModel.value.id, groupMetadata.get(item.groupId!)!)
      return groupId
    }
    return -1
  }

  function getSelectedItem() : MediaItem {
    return selectedItem.get(activeModel.value!.id)!
  }
  
  function getSelectedGroup() : GroupMetadata {
    return selectedGroup.get(activeModel.value!.id)!
  }
  
  function abortAllPending() {
    // tear down _every_ in‐flight request
    for (const ctrl of pendingControllers.values()) {
      ctrl.abort()
    }
    pendingControllers.clear()
  }

  function setAddedAtMap(modelId: number, set: ILSets): Map<number, number> {
    let byModel = setAddedAt.get(modelId)
    if (!byModel) {
      byModel = new Map()
      setAddedAt.set(modelId, byModel)
    }
    let bySet = byModel.get(set)
    if (!bySet) {
      bySet = new Map()
      byModel.set(set, bySet)
    }
    return bySet
  }

  return {
    items, 
    modelItems,
    fetchMediaItem, 
    fetchMediaItems, 
    addItemToSet, 
    addItemsToSet, 
    removeItemFromSet, 
    removeItemsFromSet, 
    removeModelFromItems,
    isItemInPos,
    isItemInNeg,
    isItemInHistory,
    isItemInSubmitted,
    getSetItems,
    fetchItemInfo,
    fetchGroupInfo,
    fetchRelatedItems,
    setSelectedItem,
    getSelectedGroup,
    getSelectedItem,
    abortAllPending,
  }
})