// Return types for ExquisitorAPI calls

import type { Filter } from "./filter"
import type { MediaType, RelatedItems } from "./mediaitem"
import type { GridGroup } from "./model"

export interface ExqInitResponse {
    session: string,
    totalItems: number
}

export interface ExqInitModelRequest {
    session: string,
    modelId: number,
}

export interface ExqInitModelResponse {
    groups: GridGroup[]
}

export interface ExqRemoveModelRequest {
    session: string
    modelId: number
}

export interface ExqURFRequest {
    session: string
    modelId: number
    n: number
    pos: number[]
    neg: number[]
    seen: number[]
    filters: {
        names: string[]
        values: number[][]
    }
    excluded: {
        excludedGroup: number[]
    }
}

export interface ExqSearchResponse {
    suggestions : number[]
}

export interface ExqGetItemResponse {
    id: number
    name: string
    mediaId: number
    mediaType: MediaType
    thumbPath: string
    srcPath: string
}

export interface ExqGetFiltersResponse {
    filters : Filter[]
}

export interface ExqApplyFiltersRequest {
    session: string
    model: number
    names: string[]
    values: number[][]
}

export interface ExqExcludeVideoRequest {
    session: string
    model: number
    itemId: number
}

export interface ExqExcludeVideoResponse {
    excludedOrNot: boolean 
}

export interface ExqClearExcludedVideoRequest {
    session: string
    model: number
    items: number[]
}

export interface ExqGetExcludedVideosRequest {
    session: string
    model: number
}

export interface ExqGetExcludedVideosResponse {
    videos: number[]
}

export interface ExqResetFilterRequest {
    session: string
    model: number
}

export interface ExqSubmissionRequest {
    session: string
    model: number
    id: number,
    evalId: string,
}

export interface ExqTextSubmissionRequest {
    session: string
    model: number
    text: string,
    evalId: string,
}

export interface ExqSearchRequest {
    query: string
}

export interface ExqQueryRewriteRequest {
    query: string
    positive: number
}