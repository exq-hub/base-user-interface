// Return types for ExquisitorAPI calls

import type { Filter } from "./filter"
import type { MediaType, VideoSegment } from "./mediaitem"
import type { GridGroup } from "./model"

export interface ExqSessionInfo {
    session: string,
    collection: string,
    modelId: number
}

export interface ExqInitResponse {
    session: string,
    collections: string[], 
    evaluations: {id: string, name: string}[]
}

export interface ExqInitModelResponse {
    groups: GridGroup[]
}

export interface ExqURFRequest {
    session_info: ExqSessionInfo
    n: number
    pos: number[]
    neg: number[]
    seen: number[]
    filters?: {
        names: string[]
        values: (number | string)[][]
    }
    excluded?: number[]
}

export interface ExqURFResponse {
    suggestions : number[]
}

export interface ExqTextSearchRequest {
    session_info: ExqSessionInfo
    n: number
    text: string
    seen?: number[]
    filters?: {
        names: string[]
        values: (number | string)[][]
    }
    excluded: number[]
}

export interface ExqChatFeedbackRequest {
    session_info: ExqSessionInfo
    n: number
    text: string
    pos: []
    seen: []
    filters: {
        names: string[]
        values: number[][]
    }
    excluded: number[]
}

export interface ExqQueryRewriteRequest {
    query: string
    positive: number
}

export interface ExqGetItemResponse {
    id: number
    name: string
    mediaId: number
    mediaType: MediaType
    thumbPath: string
    srcPath: string
    relatedGroupId: string
    segmentInfo?: VideoSegment
}

export interface ExqGetFiltersResponse {
    filters : Filter[]
}

export interface ExqApplyFiltersRequest {
    session_info : ExqSessionInfo
    name: string
    values: (number | string)[]
}

export interface ExqExcludeGroupRequest {
    session_info: ExqSessionInfo
    itemId: number
}

export interface ExqIsExcludedRequest {
    session_info: ExqSessionInfo
    itemId: number
    excluded_ids: number[]
}

export interface ExqExcludeGroupResponse {
    excludedOrNot: boolean 
}

export interface ExqClearExcludedGroupRequest {
    session_info: ExqSessionInfo
    items: number[]
}

export interface ExqGetExcludedGroupsRequest {
    session: string
    model: number
}

export interface ExqGetExcludedGroupsResponse {
    excGroups: number[]
}

export interface ExqSubmissionRequest {
    session: string
    modelId: number
    collection: string
    name?: string
    text: string
    qa: boolean
    evalId: string
    start?: number
    end?: number
    itemId?: number
}

export interface ExqClearItemSetRequest {
    session: string
    modelId: number
    name: string
}