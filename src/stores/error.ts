// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineStore } from 'pinia'

export const useErrorStore = defineStore('error', () => {
  const visible = ref(false)
  const message = ref('')

  function show(err: unknown) {
    message.value = err instanceof Error ? err.message : String(err)
    visible.value = true
  }

  function dismiss() {
    visible.value = false
  }

  return { visible, message, show, dismiss }
})
