// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { FilterInfo, FilterValue } from '@/types/filter'
import { get, mock } from './http'
import { getFilters as mockGetFilters } from './MockExquisitorAPI'

export const getFiltersInfo = async (session: string, collection: string): Promise<FilterInfo[]> => {
    if (mock) return (await mockGetFilters()).filters
    return get('/exq/info/filters/' + session + '/' + collection)
}

export const getFilterValues = async (
    session: string,
    collection: string,
    tagtypeId: number,
    filterId: number
): Promise<FilterValue[]> =>
    get('/exq/info/filters/values/' + session + '/' + collection + '/' + tagtypeId + '/' + filterId)
