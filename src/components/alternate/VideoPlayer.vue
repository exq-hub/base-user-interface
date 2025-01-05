<template>
    <v-card flat>
        <v-card-text>
                <!-- Main video -->
            <video
             ref="videoRef"
             v-if="videoSource"
             :src="videoSource"
             :poster="videoPoster"
             controls
             style="max-width: 100%; height: auto;"
             @loadedmetadata="onMetadataLoaded"
            >
                Your browser does not support the video tag.
            </video>
        
            <div class="mt-2" v-if="hasSegment && segment">
                <p>Segment: {{ segment.start }}s - {{ segment.end }}s</p>
                <v-switch
                 v-model="loopSegment"
                 label="Loop this segment"
                />
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Example of a MediaItem and VideoSegment interfaces
interface VideoSegment {
    segmentId: string
    start: number
    end: number
    previewUrl?: string
    fullVideoUrl?: string
}

interface MediaItem {
    id: number
    title: string
    type: 'video' | 'image' | 'audio'
    thumbnailUrl: string
    segments?: VideoSegment[]
    // etc...
}

// Props
const props = defineProps<{
    item: MediaItem
    selectedSegmentId?: string
}>()

// Local references
const videoRef = ref<HTMLVideoElement | null>(null)
const loopSegment = ref<boolean>(false)

// Find the requested segment if it exists
const segment = computed<VideoSegment | undefined>(() => {
    if (!props.selectedSegmentId || !props.item.segments) return undefined
    return props.item.segments.find(s => s.segmentId === props.selectedSegmentId)
})

// Shortcut booleans
const hasSegment = computed(() => !!segment.value)

// In some designs, you might store the full video URL in each segment or in the item.
// For simplicity, we take either the segment’s `fullVideoUrl` if present,
// otherwise, a top-level `videoUrl` in your MediaItem (not shown in the interface here).
const videoSource = computed(() => {
    // If there's a specific segment with a unique URL:
    if (segment.value?.fullVideoUrl) return segment.value.fullVideoUrl
    
    // Otherwise, you might have a top-level video URL in the item
    // e.g. props.item.videoUrl
    return '' // Adjust to your actual video source
})

// Poster image
const videoPoster = computed(() => {
    return props.item.thumbnailUrl
})

// When the video metadata loads, jump to the segment start if relevant
function onMetadataLoaded() {
    if (!videoRef.value || !segment.value) return
    videoRef.value.currentTime = segment.value.start
}

watch(loopSegment, newVal => {
    // If loopSegment is toggled on, set the event listener for timeupdate
    // to auto-loop the segment. Otherwise, remove it.
    if (newVal) {
        videoRef.value?.addEventListener('timeupdate', handleTimeUpdate)
    } else {
        videoRef.value?.removeEventListener('timeupdate', handleTimeUpdate)
    }
})

function handleTimeUpdate() {
    const vid = videoRef.value
    const seg = segment.value
    if (!vid || !seg) return
    if (vid.currentTime >= seg.end) {
        // Jump back to segment start
        vid.currentTime = seg.start
    }
}

onMounted(() => {
    if (loopSegment.value) {
        videoRef.value?.addEventListener('timeupdate', handleTimeUpdate)
    }
})
</script>

<style scoped>
/* Add any styling you need */
</style>
