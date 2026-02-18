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
    // K = modelId, V = Set<ItemId>
    const modelExcluded : Map<number, Set<number>> = reactive(new Map<number,Set<number>>())
    
    const modelStore = useModelStore()
    const activeModel = reactive(computed(() => modelStore.activeModel))

    const selectedItem : Map<number, MediaItem> = reactive(new Map<number, MediaItem>())
    const selectedGroup : Map<number, GroupMetadata> = reactive(new Map<number, GroupMetadata>())

    const pendingControllers = new Map<string, AbortController>()

    const filterStore = useFilterStore()

    async function fetchMediaItem(exqId: number, modelId: number) : Promise<MediaItem> {
        const collection = modelStore.getModelCollection(modelId)
        if (modelItems.has(modelId)) {
            modelItems.get(modelId)!.add(exqId)
        } else {
            modelItems.set(modelId, new Set<number>())
            modelItems.get(modelId)!.add(exqId)
        }

        if (!items.has(collection)) {
            items.set(collection, new Map<number, MediaItem>())
        }
        if (items.get(collection)!.has(exqId)) {
            // console.log('Fetching media item ' + exqId + ' from memory')
            if (!items.get(collection)!.get(exqId)!.currentSets!.has(modelId)) {
                items.get(collection)!.get(exqId)!.currentSets!.set(modelId, [false,false,false,false])
            }
            return items.get(collection)!.get(exqId)! // '!' Non-null
        } else {
            const key = `${collection}/${modelId}/${exqId}`
            const ctrl = new AbortController()
            pendingControllers.set(key, ctrl)
            // console.log('Fetching media item ' + exqId + ' from API')
            try {
                const item = await getItem(
                    useAppStore().session, 
                    exqId, modelId, 
                    modelStore.getModelCollection(modelId),
                    { signal: ctrl.signal }
                )
                items.get(collection)!.set(exqId, item)
                // console.log('exqId', items.get(collection)!.get(exqId))
                return item
            } finally {
                pendingControllers.delete(key)
            }
        }
   }
    
    async function fetchMediaItems(exqIds: number[], modelId: number, collection: string) : Promise<MediaItem[]> {
        if (!items.has(collection)) {
            items.set(collection, new Map<number, MediaItem>())
        }
        const mediaItems: MediaItem[] = await Promise.all(exqIds.map(async (v) => {
            const modelSet = modelItems.get(modelId) ?? new Set<number>()
            modelSet.add(v)
            if (!modelItems.has(modelId)) {
                modelItems.set(modelId, modelSet)
            }
            if (items.get(collection)!.has(v)) {
                if (!items.get(collection)!.get(v)!.currentSets!.has(modelId)) {
                    items.get(collection)!.get(v)!.currentSets!.set(modelId, [false,false,false,false])
                }
                return items.get(collection)!.get(v)!
            } else {
                const item = await getItem(useAppStore().session, v, modelId, collection)
                items.get(collection)!.set(v, item)
                return item
            }
        }))
        return mediaItems
    }

    function addItemToSet(exqId: number, modelId: number, ilset: ILSets) : void {
        console.log('Adding Item:', exqId, 'to set', ilset, 'for model', modelId)
        const collection = modelStore.getModelCollection(modelId)
        switch (ilset) {
            case ILSets.Positives:
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives] = true
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives] = false
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.History] = false
                return
            case ILSets.Negatives:
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives] = false
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives] = true
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.History] = false
                return
            case ILSets.History:
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives] = false
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives] = false
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.History] = true
                return
            case ILSets.Submitted:
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Submitted] = true
                return
            default:
                items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ilset] = true 
        }
    }
    
    function addItemsToSet(exqIds: number[], modelId: number, ilset: ILSets) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        exqIds.forEach((v,_) => {
            items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset] = true 
            if (!items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset]) {
                console.log('Unable to add set to item: ' + ilset + ' ' + v)
                return false
            }
        })
        return true
    } 
    
    function removeItemFromSet(exqId: number, modelId: number, ilset: ILSets) : void {
        const collection = modelStore.getModelCollection(modelId)
        items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ilset] = false
    }
    
    function removeItemsFromSet(exqIds: number[], modelId: number, ilset: ILSets) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        exqIds.forEach((v,_) => {
            items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset] = false
            if (items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset]) {
                console.log('Unable to delete set from item: ' + ilset + ' ' + v)
                return false
            }
        })
        return true
    }
    
    function removeModelFromItems(modelId: number) : void {
        const collection = modelStore.getModelCollection(modelId)
        items.get(collection)!.forEach(item => item.currentSets!.delete(modelId))
    }
    
    function isItemInPos(exqId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(exqId)) return false
        if (!items.get(collection)!.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives]
    }

    function isItemInNeg(exqId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(exqId)) return false
        if (!items.get(collection)!.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives]
    }

    function isItemInHistory(exqId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(exqId)) return false
        if (!items.get(collection)!.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.History]
    }

    function isItemInSubmitted(exqId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(exqId)) return false
        if (!items.get(collection)!.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(exqId)!.currentSets!.get(modelId)![ILSets.Submitted]
    }

    function getSetItems(modelId: number, set: ILSets) : MediaItem[] {
        const collection = modelStore.getModelCollection(modelId)
        let setItems : MediaItem[] = []
        // Get all items for the current model
        let mItems = modelItems.get(modelId)
        mItems?.forEach((value, _) => {
            if (items.get(collection)!.get(value)!.currentSets!.get(modelId)![set])
                setItems.push(items.get(collection)!.get(value)!)
        })
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
        console.log('item_filter_ids:', item_filter_ids)

        // Fetch metadata
        let metadata = await getItemInfo(modelId, itemId, collection, item_filter_ids)
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
        console.log(modelId, groupId)
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
        let metadata = await getItemInfo(modelId, groupId, collection, group_filter_ids)
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
        let relatedItems = await getRelatedItems(modelId, groupId, collection)
        groupMetadata.get(groupId)!.items = relatedItems
        return relatedItems
    }

    function excludeItemGroup(exqId: number, modelId: number) {
        if (!modelExcluded.has(modelId)) {
            modelExcluded.set(modelId, new Set<number>())
        }
        modelExcluded.get(modelId)!.add(exqId)
    }

    async function removeItemFromExclude(exqId: number) {
        if (activeModel.value) {
            modelExcluded.get(activeModel.value.id)!.delete(exqId)
        }
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

    return {
        items, 
        modelItems,
        modelExcluded,
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
        excludeItemGroup,
        removeItemFromExclude,
        setSelectedItem,
        getSelectedGroup,
        getSelectedItem,
        abortAllPending,
    }
})