// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { getMainURI, mock } from './http'

export const logEvents = (events: ClientEvent[]): void => {
    if (mock) return
    console.log('Logging events:', events)
    if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(events)], { type: 'application/json' })
        navigator.sendBeacon(getMainURI() + '/exq/log/clientEvent', blob)
        return
    }
    // Fixed: was missing /exq/ prefix in the fallback path
    fetch(getMainURI() + '/exq/log/clientEvent', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(events),
    }).then()
}
