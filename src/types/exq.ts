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

// /exq/info/indexes
export interface ExqIndexInfo {
  name: string
  index_type: string
  embedding_type: string
  source_type: string
  default: boolean
}

// One ranked chain of segments within a video
export interface ExqTemporalChain {
  group: number
  items: number[]
  length: number
  score: number
  start_ms: number
  end_ms: number
}

export interface ExqTemporalSearchResponse {
  suggestions: ExqTemporalChain[]
}

export type ExqTemporalHop =
  | { kind: 'query'; text: string; index_name?: string; weight?: number; filters?: ActiveFiltersDB }
  | { kind: 'rf'; pos: number[]; neg: number[]; query?: string; index_name?: string; weight?: number; filters?: ActiveFiltersDB }

export interface ExqTemporalSearchRequest {
  session_info: ExqSessionInfo
  n: number
  hops: ExqTemporalHop[]
  seen?: number[]
  excluded?: number[]
  filters?: ActiveFiltersDB
  top_r?: number
  rrf_k?: number
  chains_per_video?: number
  iou_threshold?: number
}


// /exq/item/info
export interface ExqGetItemResponse {
  id: number
  name: string
  mediaId: number
  mediaType: MediaType
  thumbPath: string
  srcPath: string
  groupId?: number
  // Only present when filterIds were sent, keyed by tagset name
  metadata?: Record<string, number | string | (number | string)[]>
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
  text?: string
  qa: boolean
  evalId: string
  start?: number
  end?: number
}

export interface ExqSubmissionResult {
  status: boolean
  submission: string // 'CORRECT' | 'WRONG' | anything else the server reports
  description: string
}

export interface ExqClearItemSetRequest {
  session: string
  modelId: number
  name: string
}