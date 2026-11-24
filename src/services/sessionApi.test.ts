// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initSession } from './sessionApi'

const collections = ['pvd']

// Answers /exq/init like the LSE and /dres/evaluation_list/ with `dres`
function stubFetch(dres: () => Promise<Response>) {
    vi.stubGlobal('fetch', vi.fn((url: string) => {
        if (url.includes('/exq/init/')) {
            const session = url.split('/').pop()
            return Promise.resolve(Response.json({ session, collections }))
        }
        if (url.includes('/dres/evaluation_list/')) return dres()
        return Promise.reject(new Error(`unexpected fetch ${url}`))
    }))
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('initSession', () => {
    it('returns the evaluations DRES lists', async () => {
        const evaluations = [{ id: 'e1', name: 'Evaluation 1' }]
        stubFetch(() => Promise.resolve(Response.json(evaluations)))

        const result = await initSession()

        expect(result.collections).toEqual(collections)
        expect(result.evaluations).toEqual(evaluations)
    })

    it('has no evaluations when DRES is not found', async () => {
        stubFetch(() => Promise.resolve(new Response('Not Found', { status: 404 })))

        expect((await initSession()).evaluations).toEqual([])
    })

    it('has no evaluations when the DRES path answers with a web page', async () => {
        // e.g. a proxy passing /dres to the UI's own server
        stubFetch(() => Promise.resolve(new Response('<!doctype html><html></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
        })))

        const result = await initSession()

        expect(result.collections).toEqual(collections)
        expect(result.evaluations).toEqual([])
    })

    it('has no evaluations when DRES fails', async () => {
        stubFetch(() => Promise.resolve(new Response('Bad Gateway', { status: 502 })))

        expect((await initSession()).evaluations).toEqual([])
    })

    it('has no evaluations when DRES cannot be reached', async () => {
        stubFetch(() => Promise.reject(new TypeError('Failed to fetch')))

        expect((await initSession()).evaluations).toEqual([])
    })

    it('has no evaluations when DRES answers with something other than a list', async () => {
        stubFetch(() => Promise.resolve(Response.json({ detail: 'oops' })))

        expect((await initSession()).evaluations).toEqual([])
    })
})
