// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ExqExcludeGroupRequest, ExqExcludeGroupResponse, ExqIsExcludedRequest } from '@/types/exq'
import { mock, post } from './http'

export const excludeGroup = async (req: ExqExcludeGroupRequest): Promise<void> => {
    if (mock) return
    await post('/exq/log/exclude', req)
}

export const isGroupExcluded = async (req: ExqIsExcludedRequest): Promise<boolean> => {
    if (mock) return false
    const resp: ExqExcludeGroupResponse = await post('/exq/item/excluded', req)
    return resp.excludedOrNot
}
