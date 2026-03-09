// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later

export const exqURI = 'https://localhost:5000'
export const mock = false

export const getMainURI = () => exqURI

export async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    const resp = await fetch(exqURI + path, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    })
    return resp.json()
}

export async function get<T>(path: string): Promise<T> {
    const resp = await fetch(exqURI + path, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
    })
    return resp.json()
}
