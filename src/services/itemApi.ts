// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ExqGetItemResponse } from '@/types/exq'
import type MediaItem from '@/types/mediaitem'
import { mock, post } from './http'
import { getItem as mockGetItem, getItemInfoMock } from './MockExquisitorAPI'

export const getItem = async (
    session: string,
    exqId: number,
    modelId: number,
    collection: string,
    opts?: { signal?: AbortSignal }
): Promise<MediaItem> => {
    if (mock) return mockGetItem(exqId, modelId)
    const sets = new Map<number, boolean[]>()
    sets.set(modelId, [false, false, false, false])
    const resp: ExqGetItemResponse = await post('/exq/item/base', {
        session_info: { session, modelId, collection },
        mediaId: exqId,
    }, opts?.signal)
    return {
        id: resp.id,
        name: resp.name,
        itemId: resp.itemId,
        currentSets: sets,
        groupId: resp.groupId,
        mediaType: resp.mediaType,
        thumbPath: resp.thumbPath,
        srcPath: resp.srcPath,
    }
}

export const getItemInfo = async (
    session: string,
    model: number,
    mediaId: number,
    collection: string,
    filterIds: number[]
): Promise<Record<string, number | string | (number | string)[]>> => {
    if (mock) return getItemInfoMock(mediaId)
    return post('/exq/item/details', {
        session_info: { session, modelId: model, collection },
        mediaId,
        filterIds,
    })
}

export const getRelatedItems = async (
    session: string,
    model: number,
    mediaId: number,
    collection: string
): Promise<number[]> => {
    if (mock) return [10, 20, 30, 40, 50]
    const resp: { related: number[] } = await post('/exq/item/related', {
        session_info: { session, modelId: model, collection },
        mediaId,
    })
    return resp.related
}
