import { defineStore } from 'pinia'
import { useFilterStore } from '@/stores/filter'
import { useItemStore } from '@/stores/item'
import { getItemInfo } from "@/services/ExquisitorAPI";
import type { GroupMetadata } from '@/types/mediaitem'


function key(collection: string, groupId: number) {
  return `${collection}:${groupId}`
}

export const useGroupStore = defineStore('group', () => {
  const filterStore = useFilterStore()
  const itemStore = useItemStore()

  // Cache: collection+groupId -> GroupMetadata
  const groupMetadata = shallowReactive(new Map<string, GroupMetadata>())

  // Cache: collection -> filter ids needed for group metadata
  const groupFilterIdsByCollection = shallowReactive(new Map<string, number[]>())

  function get(collection: string, groupId: number): GroupMetadata | null {
    return groupMetadata.get(key(collection, groupId)) ?? null
  }

  function computeGroupFilterIds(collection: string): number[] {
    const mainTagsets = filterStore.mainGroupTagsets
    const otherTagsets = filterStore.otherGroupTagsets
    const nameIdMap = filterStore.filterNameIdMap.get(collection)

    const ids: number[] = []
    if (!nameIdMap) return ids

    for (const name of mainTagsets) {
      const id = nameIdMap.get(name)
      if (id != null) ids.push(id)
    }
    for (const name of otherTagsets) {
      const id = nameIdMap.get(name)
      if (id != null) ids.push(id)
    }
    return ids
  }

  function getGroupFilterIds(collection: string): number[] {
    const cached = groupFilterIdsByCollection.get(collection)
    if (cached) return cached
    const ids = computeGroupFilterIds(collection)
    groupFilterIdsByCollection.set(collection, ids)
    return ids
  }

  /**
   * Fetch group info + metadata for a (collection, groupId).
   *
   * IMPORTANT FUTURE UPDATE:
   * - When backend supports batch group info, add:
   *   ensureGroups(collection, groupIds[]) that fills groupMetadata with one call.
   * - When backend supports batch item info, replace getItemInfo(...) calls similarly.
   */
  async function fetchGroupInfo(collection: string, groupId: number, modelIdForSessionContext?: number): Promise<GroupMetadata> {
    const k = key(collection, groupId)
    const existing = groupMetadata.get(k)
    if (existing) return existing

    // Initialize base entry. Your existing logic treats groupId as a MediaItem.
    // Keep it, but it's now centralized here.
    // NOTE: This requires modelId to correctly resolve session/model context in fetchMediaItem.
    // If your API can fetch group MediaItem without modelId, update itemStore accordingly.
    if (modelIdForSessionContext == null) {
      throw new Error('fetchGroupInfo requires modelIdForSessionContext to fetch base group media info.')
    }

    const groupInfo = await itemStore.fetchMediaItem(groupId, modelIdForSessionContext)

    const base: GroupMetadata = {
      src: groupInfo.srcPath,
      groupMediaType: groupInfo.mediaType,
      items: [],
      metadata: {}
    }
    groupMetadata.set(k, base)

    // Fetch metadata
    const group_filter_ids = getGroupFilterIds(collection)

    // TODO (future batch endpoint): replace this per-group call with a batched getItemInfo for many groupIds.
    const metadata = await getItemInfo(modelIdForSessionContext, groupId, collection, group_filter_ids)
    if (!metadata || Object.keys(metadata).length === 0) {
      return base
    }

    // Keep only configured tagsets
    for (const tag of filterStore.mainGroupTagsets) {
      if (metadata[tag] !== undefined) base.metadata[tag] = metadata[tag]
    }
    for (const tag of filterStore.otherGroupTagsets) {
      if (metadata[tag] !== undefined) base.metadata[tag] = metadata[tag]
    }

    return base
  }

  /**
   * Prefetch many groups (used by ResultGrid).
   *
   * IMPORTANT FUTURE UPDATE:
   * Replace Promise.all with ONE API call once you add:
   * - group/info/batch (or similar)
   */
  async function fetchGroupsInfo(collection: string, groupIds: number[], modelIdForSessionContext: number) {
    const unique = Array.from(new Set(groupIds)).filter((g) => g != null && g !== -1)
    const missing = unique.filter((g) => !groupMetadata.has(key(collection, g)))
    if (missing.length === 0) return

    // TODO (future batch endpoint): one request here.
    await Promise.all(missing.map((g) => fetchGroupInfo(collection, g, modelIdForSessionContext)))
  }

  return {
    groupMetadata,
    get,
    fetchGroupInfo,
    fetchGroupsInfo
  }
})