// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ExqInitResponse, ExqSessionInfo } from '@/types/exq'
import { exqURI, get, mock, post } from './http'
import {
    initSession as mockInitExq,
} from './MockExquisitorAPI'

function generateString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return result
}

/**
 * Evaluations from DRES, a separate evaluation service that is often not running.
 * Anything but a list from it (no DRES, an error, a web page) means no evaluations.
 */
async function fetchEvaluations(): Promise<{ id: string; name: string }[]> {
    try {
        const resp = await fetch(exqURI + '/dres/evaluation_list/')
        if (!resp.ok) return []
        const evals: unknown = await resp.json()
        return Array.isArray(evals) ? evals : []
    } catch {
        return []
    }
}

export const initSession = async (): Promise<ExqInitResponse> => {
    if (mock) return mockInitExq()
    const session = generateString(10)
    const resp = await get<{ session: string; collections: string[] }>(
        '/exq/init/' + session
    )
    const evals = await fetchEvaluations()
    return {
        session: resp.session,
        collections: resp.collections,
        evaluations: evals,
    }
}

export const initModel = (req: ExqSessionInfo): void => {
    if (mock) return
    post('/exq/log/addModel', req)
}

export const removeModel = (req: ExqSessionInfo): void => {
    if (mock) return
    post('/exq/log/removeModel', req)
}

// TODO: endpoint not yet defined
export const getCollections = async (): Promise<string[]> =>
    get('/CALL_TO_API_HERE')
