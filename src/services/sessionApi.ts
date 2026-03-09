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

export const initSession = async (): Promise<ExqInitResponse> => {
    if (mock) return mockInitExq()
    const session = generateString(10)
    const resp = await get<{ session: string; totalItems: number[]; collections: string[] }>(
        '/exq/init/' + session
    )
    // DRES is a separate evaluation service — fetched separately on init
    const evals: { id: string; name: string }[] = await fetch(exqURI + '/dres/evaluation_list/')
        .then(val => val.status !== 404 ? val.json() : [])
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
