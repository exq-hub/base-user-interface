// SPDX-FileCopyrightText: 2026 Ujjwal Sharma and Omar Shahbaz Khan
// SPDX-License-Identifier: AGPL-3.0-or-later
import { getIndexes } from "@/services/ExquisitorAPI"
import { ExqIndexInfo } from "@/types/exq"
import { defineStore } from "pinia"
import { useAppStore } from "./app"

export const useSearchIndexStore = defineStore('searchIndex', () => {
  // collection -> available indexes
  const indexes = reactive(new Map<string, ExqIndexInfo[]>())

  // Fetched once per collection, a failed fetch is retried on the next call
  async function load(collection: string) {
    if (indexes.has(collection)) return
    indexes.set(collection, [])
    try {
      indexes.set(collection, await getIndexes(useAppStore().session, collection))
    } catch (e) {
      indexes.delete(collection)
      throw e
    }
  }

  // The named index, or the collection's default when no name is given
  function indexFor(collection: string, name?: string): ExqIndexInfo | undefined {
    const list = indexes.get(collection) ?? []
    return name !== undefined ? list.find(i => i.name === name) : list.find(i => i.default)
  }

  function indexLabel(collection: string, name?: string): string | undefined {
    const idx = indexFor(collection, name)
    return idx && `${idx.index_type} · ${idx.name}`
  }

  return {
    indexes,
    load,
    indexFor,
    indexLabel
  }
})
