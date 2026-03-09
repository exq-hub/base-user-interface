// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later

export const exqURI = 'https://localhost:5000'
export const mock = false

export const getMainURI = () => exqURI

async function checkResponse(resp: Response): Promise<void> {
    if (!resp.ok) {
        let detail = ''
        try {
            const text = await resp.text()
            detail = text ? `: ${text}` : ''
        } catch { /* ignore */ }
        throw new Error(`HTTP ${resp.status} ${resp.statusText}${detail} — ${resp.url}`)
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
    await checkResponse(resp)
    return resp.json()
}

export async function get<T>(path: string): Promise<T> {
    const resp = await fetch(exqURI + path, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
    })
    await checkResponse(resp)
    return resp.json()
}
