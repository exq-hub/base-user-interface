// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ExqGetItemResponse, ExqGetItemsResponse } from '@/types/exq'
import type MediaItem from '@/types/mediaitem'
import { mock, post } from './http'
import { getItem as mockGetItem, getItemInfoMock } from './MockExquisitorAPI'

export const getItem = async (
    session: string,
    exqId: number,
    modelId: number,
    collection: string,
    opts?: { filterIds?: number[], signal?: AbortSignal }
): Promise<MediaItem> => {
    const filterIds = opts?.filterIds ?? []
    if (mock) {
        const item = await mockGetItem(exqId, modelId)
        if (filterIds.length > 0) item.metadata = await getItemInfoMock(exqId)
        return item
    }
    const resp: ExqGetItemResponse = await post('/exq/item/info', {
        session_info: { session, modelId, collection },
        mediaId: exqId,
        filterIds,
    }, opts?.signal)
    return toMediaItem(resp, modelId)
}

// One request for many items, ids the collection doesn't have come back in missing
export const getItems = async (
    session: string,
    exqIds: number[],
    modelId: number,
    collection: string,
    opts?: { filterIds?: number[], signal?: AbortSignal }
): Promise<{ items: MediaItem[], missing: number[] }> => {
    const filterIds = opts?.filterIds ?? []
    if (mock) {
        const items = await Promise.all(exqIds.map(id => getItem(session, id, modelId, collection, { filterIds })))
        return { items, missing: [] }
    }
    const resp: ExqGetItemsResponse = await post('/exq/item/info/batch', {
        session_info: { session, modelId, collection },
        mediaIds: exqIds,
        filterIds,
    }, opts?.signal)
    return { items: resp.items.map(it => toMediaItem(it, modelId)), missing: resp.missing }
}

function toMediaItem(resp: ExqGetItemResponse, modelId: number): MediaItem {
    const sets = new Map<number, boolean[]>()
    sets.set(modelId, [false, false, false, false])
    return {
        id: resp.id,
        itemId: resp.mediaId,
        currentSets: sets,
        groupId: resp.groupId,
        mediaType: resp.mediaType,
        thumbPath: resp.thumbPath,
        srcPath: resp.srcPath,
        ...(resp.metadata && { metadata: resp.metadata }),
    }
}

export const getRelatedItems = async (
    session: string,
    model: number,
    mediaId: number,
    collection: string,
    // Tagset ID to order by, such as Start (ms). The server returns them unsorted if omitted
    sortBy?: number,
    sortOrder: 'asc' | 'desc' = 'asc'
): Promise<number[]> => {
    if (mock) return [10, 20, 30, 40, 50]
    const resp: { related: number[] } = await post('/exq/item/related', {
        session_info: { session, modelId: model, collection },
        mediaId,
        ...(sortBy !== undefined && { sortBy, sortOrder }),
    })
    return resp.related
}
