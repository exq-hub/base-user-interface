export interface ChatEntryQueryText {
    userQuery: string,
    vlmResults: number[],
}

export interface ChatEntryQueryPos {
    userQuery: string,
    positive: number,
    rewriteSuggestion: string
}

export interface ChatQuery {
    id: string
    text: string
    timestamp: number
    resultIds: number[] 
}

export interface ChatSession {
    queries: ChatQuery[]
    positiveSelections: Set<string>
    negativeSelections: Set<string>
    filters: Record<string, any>  // multi-tag, range, date, etc.
}