// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { ActiveFiltersDB } from "./filter"

export interface ExqSearchResponse {
  suggestions: number[],
}

export interface ExqQueryRewriteResponse {
  userQuery: string,
  positive: number,
  rewriteSuggestion: string
}

export interface ChatQuery {
  id: string
  name: string
  text: string
  searchType: string
  searchModel: string
  timestamp: number
  resultIds: number[]
  filters: ActiveFiltersDB | undefined
}

export interface AdvancedSearchPayload {
  queryName: string,
  queryText: string,
  filters: ActiveFiltersDB | undefined,
  searchType: string,
  searchModel: string
  history?: boolean
}