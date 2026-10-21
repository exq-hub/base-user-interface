// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { ActiveFiltersDB } from "./filter"
import type { ExqTemporalChain } from "./exq"

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
  // Set by the index dropdown once it exists, the server default is used otherwise
  indexName?: string
  // Only on temporal entries
  chains?: ExqTemporalChain[]
}

export interface AdvancedSearchPayload {
  queryName: string,
  queryText: string,
  filters: ActiveFiltersDB | undefined,
  searchType: string,
  searchModel: string
  history?: boolean
}