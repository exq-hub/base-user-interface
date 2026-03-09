// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', () => {
  const visible = ref(false)
  const message = ref('')
  const detail = ref('')

  function show(err: unknown, requestDetail?: string) {
    message.value = err instanceof Error ? err.message : String(err)
    detail.value = requestDetail ?? ''
    visible.value = true
  }

  function dismiss() {
    visible.value = false
    detail.value = ''
  }

  return { visible, message, detail, show, dismiss }
})
