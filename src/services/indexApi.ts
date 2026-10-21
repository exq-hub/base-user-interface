// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ExqIndexInfo } from '@/types/exq'
import { get, mock } from './http'

export const getIndexes = async (session: string, collection: string): Promise<ExqIndexInfo[]> => {
    if (mock) return [
        { name: 'clip', index_type: 'clip', embedding_type: 'image', source_type: 'keyframe', default: true },
        { name: 'caption', index_type: 'text', embedding_type: 'text', source_type: 'caption', default: false },
    ]
    return get('/exq/info/indexes/' + session + '/' + collection)
}
