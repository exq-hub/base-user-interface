// Return types for ExquisitorAPI calls

import type { Filter } from "./filter"
import type { MediaType } from "./mediaitem"
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
    excluded: number[]
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

export interface ExqExcludeGroupRequest {
    session: string
    model: number
    itemId: number
}

export interface ExqExcludeGroupResponse {
    excludedOrNot: boolean 
}

export interface ExqClearExcludedGroupRequest {
    session: string
    model: number
    items: number[]
}

export interface ExqGetExcludedGroupsRequest {
    session: string
    model: number
}

export interface ExqGetExcludedGroupsResponse {
    excGroups: number[]
}

export interface ExqResetFilterRequest {
    session: string
    model: number
}

export interface ExqSubmissionRequest {
    sessionId: string
    modelId: number
    name: string
    text: string
    qa: boolean
    evalId: string
}

export interface ExqSearchRequest {
    query: string
}

export interface ExqQueryRewriteRequest {
    query: string
    positive: number
}