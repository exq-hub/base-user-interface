// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import type { ExqSubmissionRequest } from '@/types/exq'
import { mock, post } from './http'

export const submitAnswer = async (req: ExqSubmissionRequest): Promise<void> => {
    console.log('EvalId:', req.evalId)
    if (mock) return
    // Fixed: was .then(val => val.json) — missing () so response was never parsed
    await post('/dres/submit', req)
}
