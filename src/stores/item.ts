import { ILSets, type ItemInfo } from "@/types/mediaitem";
import type MediaItem from "@/types/mediaitem";
import { defineStore } from "pinia";
import { reactive } from "vue";
import { getItem, getItemInfo, getRelatedItems } from "@/services/ExquisitorAPI";
import { useAppStore } from "@/stores/app";
// import { getItem } from "@/services/MockExquisitorAPI";

export const useItemStore = defineStore('item', () => {
    // K = ItemId, V = MediaItem
    const items : Map<number, MediaItem> = reactive(new Map<number,MediaItem>())
    // K = modelId, V = Set<ItemId>
    const modelItems : Map<number, Set<number>> = reactive(new Map<number,Set<number>>())
    // K = modelId, V = Set<ItemId>
    const modelExcluded : Map<number, Set<number>> = reactive(new Map<number,Set<number>>())
    
    async function fetchMediaItem(exqId: number, modelId: number) : Promise<MediaItem> {
        if (modelItems.has(modelId)) {
            modelItems.get(modelId)!.add(exqId)
        } else {
            modelItems.set(modelId, new Set<number>())
            modelItems.get(modelId)!.add(exqId)
        }

        if (items.has(exqId)) {
            // console.log('Fetching media item ' + exqId + ' from memory')
            if (!items.get(exqId)!.currentSets!.has(modelId)) {
                items.get(exqId)!.currentSets!.set(modelId, [false,false,false,false])
            }
            return items.get(exqId)! // '!' Non-null
        } else {
            // console.log('Fetching media item ' + exqId + ' from API')
            const item = await getItem(useAppStore().session, exqId, modelId)
            items.set(exqId, item)
            console.log('exqId', items.get(exqId))
            return item
        }
    }
    
    async function fetchMediaItems(exqIds: number[], modelId: number) : Promise<MediaItem[]> {
        var mediaItems : MediaItem[] = []
        exqIds.forEach(async (v,_) => {
            if (modelItems.has(modelId)) {
                modelItems.get(modelId)!.add(v)
            } else {
                modelItems.set(modelId, new Set<number>())
                modelItems.get(modelId)!.add(v)
            }           
            if (items.has(v)) {
                console.log('Getting ', items.get(v))
                if (!items.get(v)!.currentSets!.has(modelId)) {
                    items.get(v)!.currentSets!.set(modelId, [false,false,false,false])
                }
                mediaItems.push(items.get(v)!)
            } else {
                const item = await getItem(useAppStore().session, v, modelId)
                console.log('Inserting ', item)
                items.set(v, item)
                mediaItems.push(item)
            }    
        })
        return mediaItems
    }

    function addItemToSet(exqId: number, modelId: number, ilset: ILSets) : void {
        console.log('Adding Item:', exqId, 'to set', ilset, 'for model', modelId)
        switch (ilset) {
            case ILSets.Positives:
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives] = true
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives] = false
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.History] = false
                return
            case ILSets.Negatives:
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives] = false
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives] = true
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.History] = false
                return
            case ILSets.History:
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives] = false
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives] = false
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.History] = true
                return
            case ILSets.Submitted:
                items.get(exqId)!.currentSets!.get(modelId)![ILSets.Submitted] = true
                return
            default:
                items.get(exqId)!.currentSets!.get(modelId)![ilset] = true 
        }
    }
    
    function addItemsToSet(exqIds: number[], modelId: number, ilset: ILSets) : boolean {
        exqIds.forEach((v,_) => {
            items.get(v)!.currentSets!.get(modelId)![ilset] = true 
            if (!items.get(v)!.currentSets!.get(modelId)![ilset]) {
                console.log('Unable to add set to item: ' + ilset + ' ' + v)
                return false
            }
        })
        return true
    } 
    
    function removeItemFromSet(exqId: number, modelId: number, ilset: ILSets) : void {
        items.get(exqId)!.currentSets!.get(modelId)![ilset] = false
    }
    
    function removeItemsFromSet(exqIds: number[], modelId: number, ilset: ILSets) : boolean {
        exqIds.forEach((v,_) => {
            items.get(v)!.currentSets!.get(modelId)![ilset] = false
            if (items.get(v)!.currentSets!.get(modelId)![ilset]) {
                console.log('Unable to delete set from item: ' + ilset + ' ' + v)
                return false
            }
        })
        return true
    }
    
    function removeModelFromItems(modelId: number) : void {
        items.forEach(item => item.currentSets!.delete(modelId))
    }
    
    function isItemInPos(exqId: number, modelId: number) : boolean {
        if (!items.has(exqId)) return false
        if (!items.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(exqId)!.currentSets!.get(modelId)![ILSets.Positives]
    }

    function isItemInNeg(exqId: number, modelId: number) : boolean {
        if (!items.has(exqId)) return false
        if (!items.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(exqId)!.currentSets!.get(modelId)![ILSets.Negatives]
    }

    function isItemInHistory(exqId: number, modelId: number) : boolean {
        if (!items.has(exqId)) return false
        if (!items.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(exqId)!.currentSets!.get(modelId)![ILSets.History]
    }

    function isItemInSubmitted(exqId: number, modelId: number) : boolean {
        if (!items.has(exqId)) return false
        if (!items.get(exqId)!.currentSets!.has(modelId)) return false
        return items.get(exqId)!.currentSets!.get(modelId)![ILSets.Submitted]
    }

    function getSetItems(modelId: number, set: ILSets) : MediaItem[] {
        let setItems : MediaItem[] = []
        // Get all items for the current model
        let mItems = modelItems.get(modelId)
        mItems?.forEach((value, _) => {
            if (items.get(value)!.currentSets!.get(modelId)![set])
                setItems.push(items.get(value)!)
        })
        return setItems
    }
    
    async function fetchItemInfo(modelId: number, itemId: number): Promise<ItemInfo> {
        items.get(itemId)!.metadata = await getItemInfo(modelId, itemId)
        return items.get(itemId)!.metadata!
    }

    async function fetchRelatedItems(modelId: number, itemId: number): Promise<number[]> {
        items.get(itemId)!.relatedItems = await getRelatedItems(modelId, itemId)
        return items.get(itemId)!.relatedItems!
    }

    function excludeItemGroup(exqId: number, modelId: number) {
        if (!modelExcluded.has(modelId)) {
            modelExcluded.set(modelId, new Set<number>())
        }
        modelExcluded.get(modelId)!.add(exqId)
    }

    async function removeItemFromExclude(exqId: number, modelId: number) {
        let items : number[] = await getRelatedItems(modelId, exqId)
        for (let i = 0; i < items.length; i++) {
            if (modelExcluded.get(modelId)!.has(items[i])) {
                modelExcluded.get(modelId)!.delete(items[i])
                break
            }
        }
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
        removeItemFromExclude
    }
})