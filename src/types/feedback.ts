import { AppliedFilters } from "./filter"

export interface RFSession {
    positives: number[]
    negatives: number[]
    filters: AppliedFilters
    resultIds: number[]
}