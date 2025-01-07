import { ILSets, type ItemInfo } from "@/types/mediaitem";
import type MediaItem from "@/types/mediaitem";
import { defineStore } from "pinia";
import { reactive } from "vue";
import { getItem, getItemInfo, getRelatedItems } from "@/services/ExquisitorAPI";
import { useAppStore } from "@/stores/app";
import { useModelStore } from "./model";
// import { getItem } from "@/services/MockExquisitorAPI";

export const useItemStore = defineStore('item', () => {
    // K = ItemId, V = MediaItem
    const items : Map<string, Map<number, MediaItem>> = reactive(new Map<string, Map<number,MediaItem>>())
    // K = modelId, V = Set<ItemId>
    const modelItems : Map<number, Set<number>> = reactive(new Map<number,Set<number>>())
    // K = modelId, V = Set<ItemId>
    const modelExcluded : Map<number, Set<number>> = reactive(new Map<number,Set<number>>())
    
    const modelStore = useModelStore()
    const activeModel = reactive(computed(() => modelStore.activeModel))

    const selectedItem : Map<number, MediaItem> = reactive(new Map<number, MediaItem>())

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
            // console.log('Fetching media item ' + exqId + ' from API')
            const item = await getItem(useAppStore().session, exqId, modelId, modelStore.getModelCollection(modelId))
            items.get(collection)!.set(exqId, item)
            console.log('exqId', items.get(collection)!.get(exqId))
            return item
        }
   }
    
    async function fetchMediaItems(exqIds: number[], modelId: number, collection: string) : Promise<MediaItem[]> {
        var mediaItems : MediaItem[] = []
        if (!items.has(collection)) {
            items.set(collection, new Map<number, MediaItem>())
        }
        exqIds.forEach(async (v,_) => {
            if (modelItems.has(modelId)) {
                modelItems.get(modelId)!.add(v)
            } else {
                modelItems.set(modelId, new Set<number>())
                modelItems.get(modelId)!.add(v)
            }           
            if (items.get(collection)!.has(v)) {
                console.log('Getting ', items.get(collection)!.get(v))
                if (!items.get(collection)!.get(v)!.currentSets!.has(modelId)) {
                    items.get(collection)!.get(v)!.currentSets!.set(modelId, [false,false,false,false])
                }
                mediaItems.push(items.get(collection)!.get(v)!)
            } else {
                const item = await getItem(useAppStore().session, v, modelId, collection)
                console.log('Inserting ', item)
                items.get(collection)!.set(v, item)
                mediaItems.push(item)
            }    
        })
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
    
    async function fetchItemInfo(modelId: number, itemId: number): Promise<ItemInfo> {
        const collection = modelStore.getModelCollection(modelId)
        items.get(collection)!.get(itemId)!.metadata = await getItemInfo(modelId, itemId, collection)
        return items.get(collection)!.get(itemId)!.metadata!
    }

    async function fetchRelatedItems(modelId: number, itemId: number): Promise<number[]> {
        const collection = modelStore.getModelCollection(modelId)
        items.get(collection)!.get(itemId)!.relatedItems = await getRelatedItems(modelId, itemId, collection)
        return items.get(collection)!.get(itemId)!.relatedItems!
    }

    function excludeItemGroup(exqId: number, modelId: number) {
        if (!modelExcluded.has(modelId)) {
            modelExcluded.set(modelId, new Set<number>())
        }
        modelExcluded.get(modelId)!.add(exqId)
    }

    async function removeItemFromExclude(exqId: number) {
        if (activeModel.value) {
            const collection = modelStore.getModelCollection(activeModel.value.id)
            let items : number[] = await getRelatedItems(activeModel.value.id, exqId, collection)
            for (let i = 0; i < items.length; i++) {
                if (modelExcluded.get(activeModel.value.id)!.has(items[i])) {
                    modelExcluded.get(activeModel.value.id)!.delete(items[i])
                    break
                }
            }
        }
    }

    async function setSelectedItem(itemId: number) {
        if (activeModel.value) {
            const collection = modelStore.getModelCollection(activeModel.value.id)
            let item = items.get(collection)!.get(itemId)!
            let groupId = 0
            if (item.metadata === undefined) {
                item.metadata = await fetchItemInfo(activeModel.value!.id, item.id)
                console.log(item.metadata)
            }
            if (item.relatedItems === undefined) {
                item.relatedItems = await fetchRelatedItems(activeModel.value!.id, item.id)
                console.log(item.relatedItems)
                if (item.relatedItems!.length > 0) {
                    for (let i = 0; i < item.relatedItems!.length; i++) {
                        if (item.relatedItems![i] === item.id) {
                            groupId = i
                            break
                        }
                    }
                }
            }
            selectedItem.set(activeModel.value.id, items.get(collection)!.get(itemId)!)
            return groupId
        }
        return -1
    }

    function getSelectedItem() : MediaItem {
        return selectedItem.get(activeModel.value!.id)!
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
        fetchRelatedItems,
        excludeItemGroup,
        removeItemFromExclude,
        setSelectedItem,
        getSelectedItem
    }
})