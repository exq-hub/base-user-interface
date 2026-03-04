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

    async function fetchMediaItem(mediaId: number, modelId: number) : Promise<MediaItem> {
        const collection = modelStore.getModelCollection(modelId)
        if (modelItems.has(modelId)) {
            modelItems.get(modelId)!.add(mediaId)
        } else {
            modelItems.set(modelId, new Set<number>())
            modelItems.get(modelId)!.add(mediaId)
        }

        if (!items.has(collection)) {
            items.set(collection, new Map<number, MediaItem>())
        }
        if (items.get(collection)!.has(mediaId)) {
            // console.log('Fetching media item ' + mediaId + ' from memory')
            if (!items.get(collection)!.get(mediaId)!.currentSets!.has(modelId)) {
                items.get(collection)!.get(mediaId)!.currentSets!.set(modelId, [false,false,false,false])
            }
            return items.get(collection)!.get(mediaId)! // '!' Non-null
        } else {
            const key = `${collection}/${modelId}/${mediaId}`
            const ctrl = new AbortController()
            pendingControllers.set(key, ctrl)
            // console.log('Fetching media item ' + mediaId + ' from API')
            try {
                const item = await getItem(
                    useAppStore().session, 
                    mediaId, modelId, 
                    modelStore.getModelCollection(modelId),
                    { signal: ctrl.signal }
                )
                items.get(collection)!.set(mediaId, item)
                // console.log('mediaId', items.get(collection)!.get(mediaId))
                return item
            } finally {
                pendingControllers.delete(key)
            }
        }
   }
    
    async function fetchMediaItems(mediaIds: number[], modelId: number, collection: string) : Promise<MediaItem[]> {
        if (!items.has(collection)) items.set(collection, new Map<number, MediaItem>())
        if (!modelItems.has(modelId)) modelItems.set(modelId, new Set<number>())

        // Track model items
        mediaIds.forEach(id => modelItems.get(modelId)!.add(id))
        
        const colMap = items.get(collection)!
        const missing = mediaIds.filter(id => !colMap.has(id))
        if (missing.length > 0) {
            // TODO (future batch endpoint):
            // Replace Promise.all below with a single API call that accepts an array of ids:
            // const batch = await getItems(useAppStore().session, missing, modelId, collection)
            // for (const it of batch) colMap.set(it.id, it)

            const fetched = await Promise.all(
              missing.map(id => getItem(useAppStore().session, id, modelId, collection))
            )
            for (const it of fetched) colMap.set(it.id, it)
        }
    
        // Ensure currentSets entry exists for this model
        for (const id of mediaIds) {
            const it = colMap.get(id)!
            if (!it.currentSets) it.currentSets = new Map()
            if (!it.currentSets.has(modelId)) it.currentSets.set(modelId, [false, false, false, false])
        }

        return mediaIds.map(id => colMap.get(id)!)
    }
    
    function ensureItemSetEntry(exqId: number, modelId: number) {
        const collection = modelStore.getModelCollection(modelId)
        const it = items.get(collection)?.get(exqId)
        if (!it) return // or throw, or fetch synchronously (not recommended)

        if (!it.currentSets) it.currentSets = new Map()
        if (!it.currentSets.has(modelId)) it.currentSets.set(modelId, [false, false, false, false])
    }

    function addItemToSet(mediaId: number, modelId: number, ilset: ILSets) : void {
        // console.log('Adding Item:', mediaId, 'to set', ilset, 'for model', modelId)
        const collection = modelStore.getModelCollection(modelId)
        ensureItemSetEntry(mediaId, modelId)
        const sets = items.get(collection)!.get(mediaId)!.currentSets!.get(modelId)!
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
    
    function addItemsToSet(mediaIds: number[], modelId: number, ilset: ILSets) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        mediaIds.forEach((v,_) => {
            items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset] = true 
            if (!items.get(collection)!.get(v)!.currentSets!.get(modelId)![ilset]) {
                // console.log('Unable to add set to item: ' + ilset + ' ' + v)
                return false
            }
        })
        return true
    } 
    
    function removeItemFromSet(mediaId: number, modelId: number, ilset: ILSets) : void {
        const collection = modelStore.getModelCollection(modelId)
        items.get(collection)!.get(mediaId)!.currentSets!.get(modelId)![ilset] = false
    }
    
    function removeItemsFromSet(mediaIds: number[], modelId: number, ilset: ILSets) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        mediaIds.forEach((v,_) => {
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
    
    function isItemInPos(mediaId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(mediaId)) return false
        if (!items.get(collection)!.get(mediaId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(mediaId)!.currentSets!.get(modelId)![ILSets.Positives]
    }

    function isItemInNeg(mediaId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(mediaId)) return false
        if (!items.get(collection)!.get(mediaId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(mediaId)!.currentSets!.get(modelId)![ILSets.Negatives]
    }

    function isItemInHistory(mediaId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(mediaId)) return false
        if (!items.get(collection)!.get(mediaId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(mediaId)!.currentSets!.get(modelId)![ILSets.History]
    }

    function isItemInSubmitted(mediaId: number, modelId: number) : boolean {
        const collection = modelStore.getModelCollection(modelId)
        if (!items.has(collection)) return false
        if (!items.get(collection)!.has(mediaId)) return false
        if (!items.get(collection)!.get(mediaId)!.currentSets!.has(modelId)) return false
        return items.get(collection)!.get(mediaId)!.currentSets!.get(modelId)![ILSets.Submitted]
    }

    function getSetItems(modelId: number, set: ILSets): MediaItem[] {
        const collection = modelStore.getModelCollection(modelId)

        const colMap = items.get(collection)
        const mItems = modelItems.get(modelId)

        if (!colMap || !mItems) return []

        const setItems: MediaItem[] = []

        mItems.forEach((id) => {
            const it = colMap.get(id)
            if (!it) return

            const sets = it.currentSets?.get(modelId)
            if (!sets) return

            if (sets[set]) setItems.push(it)
          }
        )

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

    function excludeItemGroup(mediaId: number, modelId: number) {
        if (!modelExcluded.has(modelId)) {
            modelExcluded.set(modelId, new Set<number>())
        }
        modelExcluded.get(modelId)!.add(mediaId)
    }

    async function removeItemFromExclude(mediaId: number) {
        if (activeModel.value) {
            modelExcluded.get(activeModel.value.id)!.delete(mediaId)
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