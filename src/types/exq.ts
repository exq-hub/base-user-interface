// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Return types for ExquisitorAPI calls
 */
import type { ActiveFiltersDB, FilterInfo } from "./filter"
import type { MediaType } from "./mediaitem"
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

export interface ExqRFRequest {
  session_info: ExqSessionInfo
  n: number
  pos: number[]
  neg: number[]
  seen: number[]
  filters?: ActiveFiltersDB
  excluded?: number[]
  query?: string
}

export interface ExqRFResponse {
  suggestions : number[]
}

export interface ExqTextSearchRequest {
  session_info: ExqSessionInfo
  n: number
  text: string
  seen?: number[]
  filters?: ActiveFiltersDB
  excluded: number[]
  search_model?: string
}

export interface ExqImageSearchRequest {
  session_info: ExqSessionInfo
  n: number
  image_b64: string
  seen?: number[]
  filters?: ActiveFiltersDB
  excluded: number[]
  search_model?: string
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

export interface ExqTemporalSearchRequest {
  session_info: ExqSessionInfo
  n: number
  queries: string[]
  seen?: number[]
  filters?: (ActiveFiltersDB | undefined)[]
  excluded: number[]
  search_model?: string[]
}


export interface ExqGetItemResponse {
  id: number
  name: string
  itemId: number
  mediaType: MediaType
  thumbPath: string
  srcPath: string
  groupId?: number
}

export interface ExqGetFiltersInfoResponse {
  filters : FilterInfo[]
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
  session_info: ExqSessionInfo
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