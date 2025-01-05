// src/store/media.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface VideoSegment {
  segmentId: string
  start: number
  end: number
  previewUrl: string
}

export interface MediaItem {
  id: number
  title: string
  type: 'video' | 'image' | 'audio'
  thumbnailUrl: string
  // For videos
  segments?: VideoSegment[]
  // For albums
  albumImages?: string[]
  // For audio
  audioUrl?: string
}

export const useMediaStore = defineStore('media', () => {
    // A dictionary for quick access by ID
    const mediaMap = ref<Record<string, MediaItem>>({})

    function setMediaItems(items: MediaItem[]) {
        for (const item of items) {
            mediaMap.value[item.id] = item
        }
    }

    function getMediaItem(id: number): MediaItem | undefined {
        return mediaMap.value[id]
    }

    // Potentially add actions to fetch from server
    async function fetchMediaItemsByIds(ids: number[]) {
        // If we already have them, skip fetching. Otherwise, fetch from server.
        const missingIds = ids.filter(id => !mediaMap.value[id])
        if (missingIds.length === 0) return

        // Example fetch call
        // const response = await fetch('some/api/get-media', { ... })
        // const data = await response.json() as MediaItem[]
        // setMediaItems(data)

        // For demonstration, we do nothing or simulate data here
    }

    return {
        mediaMap,
        setMediaItems,
        getMediaItem,
        fetchMediaItemsByIds,
    }
})
