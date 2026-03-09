// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later

export const exqURI = 'https://localhost:5000'
export const mock = false

export const getMainURI = () => exqURI

export class HttpError extends Error {
    constructor(
        message: string,
        public readonly method: string,
        public readonly url: string,
        public readonly body?: unknown,
    ) {
        super(message)
        this.name = 'HttpError'
    }
}

async function checkResponse(resp: Response, method: string, body?: unknown): Promise<void> {
    if (!resp.ok) {
        let responseText = ''
        try { responseText = await resp.text() } catch { /* ignore */ }
        const msg = `HTTP ${resp.status} ${resp.statusText}${responseText ? `: ${responseText}` : ''}`
        throw new HttpError(msg, method, resp.url, body)
    }
}

export async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    const resp = await fetch(exqURI + path, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    })
    await checkResponse(resp, 'POST', body)
    return resp.json()
}

export async function get<T>(path: string): Promise<T> {
    const resp = await fetch(exqURI + path, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
    })
    await checkResponse(resp, 'GET')
    return resp.json()
}
