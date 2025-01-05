<!-- src/components/AlbumViewer.vue -->
<template>
    <v-card flat>
        <v-card-text>
            <div v-if="selectedImageUrl">
                <img
                 :src="selectedImageUrl"
                 :alt="`Album Image ${selectedIndex + 1}`"
                 style="max-width: 100%; height: auto;"
                />
            </div>
            <div v-else>
                <p>No image selected or album is empty.</p>
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MediaItem {
    id: number
    title: string
    type: 'video' | 'image' | 'audio'
    thumbnailUrl: string
    albumImages?: string[]
}

// Props: the album item and an optional selected image index
const props = defineProps<{
    item: MediaItem
    selectedImageIndex?: number
}>()

const selectedIndex = computed(() => props.selectedImageIndex ?? 0)

// If the item has albumImages, show the selected one
const selectedImageUrl = computed(() => {
    if (!props.item.albumImages || !props.item.albumImages.length) return ''
    if (selectedIndex.value < 0 || selectedIndex.value >= props.item.albumImages.length) {
        return ''
    }
    return props.item.albumImages[selectedIndex.value]
})
</script>

<style scoped>
/* Basic styling */
</style>
