<!-- src/components/MediaViewer.vue -->
<template>
    <v-card v-if="mediaItem" class="pa-2">
        <!-- Header or Title -->
        <v-card-title>
            {{ mediaItem.title }}
        </v-card-title>
        
        <!-- Main Viewer Content -->
        <v-card-text>
            <VideoPlayer
             v-if="mediaItem.type === 'video'"
             :item="mediaItem"
             :selectedSegmentId="selectedSegmentId"
            />
            <AlbumViewer
             v-else-if="mediaItem.type === 'image'"
             :item="mediaItem"
             :selectedImageIndex="selectedImageIndex"
            />
            <AudioPlayer
             v-else-if="mediaItem.type === 'audio'"
             :item="mediaItem"
            />
        </v-card-text>
        
        <!-- Related Items: only show if available -->
        <v-divider v-if="hasRelatedItems" class="my-2" />
        <RelatedItemsGrid
         v-if="hasRelatedItems"
         :type="mediaItem.type"
         :mediaItem="mediaItem"
         :selectedSegmentId="selectedSegmentId"
         :selectedImageIndex="selectedImageIndex"
         @selectSegment="onSelectSegment"
         @selectImage="onSelectImage"
        />
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMediaStore, MediaItem } from '@/stores/alternate/media'
import VideoPlayer from './VideoPlayer.vue'
import AlbumViewer from './AlbumViewer.vue'
import AudioPlayer from './AudioPlayer.vue'
import RelatedItemsGrid from './RelatedItemsGrid.vue'

// Props for which media item to show
interface Props {
    mediaId: number
    // If user clicked a specific segment or image
    selectedSegmentId?: string
    selectedImageIndex?: number
}
const props = defineProps<Props>()

const mediaStore = useMediaStore()

// Retrieve the media item from store
const mediaItem = computed<MediaItem | undefined>(() => {
    return mediaStore.getMediaItem(props.mediaId)
})

// Check if this item has related items
const hasRelatedItems = computed(() => {
    if (!mediaItem.value) return false
    if (mediaItem.value.type === 'video' && mediaItem.value.segments && mediaItem.value.segments.length) {
        return true
    }
    if (mediaItem.value.type === 'image' && mediaItem.value.albumImages && mediaItem.value.albumImages.length) {
        return true
    }
    return false
})

// Handle events from RelatedItemsGrid
function onSelectSegment(segmentId: string) {
    // e.g., update the selected segment ID so the video player jumps there
    // Or we can do it with a store, depending on your design.
    console.log('Segment selected:', segmentId)
}

function onSelectImage(index: number) {
    console.log('Album image index selected:', index)
}
</script>
