import { AppliedFilters } from "./filter"

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
    filters: AppliedFilters
}

export interface AdvancedSearchPayload {
    queryName: string,
    queryText: string,
    filters: AppliedFilters,
    searchType: string,
    searchModel: string
    history?: boolean
}