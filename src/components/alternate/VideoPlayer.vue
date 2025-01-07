<template>
    <v-card flat>
        <v-card-text>
            <video
             :src="item.srcPath"
             :poster="item.thumbPath"
             :id="item.id+item.srcPath"
             controls
             autoplay
             muted
             style="max-width: 100%; height: auto;"
            >
                Your browser does not support the video tag.
            </video>
        
            <div class="mt-2">
                <p>Segment: {{ item.segmentInfo!.start }}s - {{ item.segmentInfo!.end }}s</p>
                <v-switch
                 v-model="loopSegment"
                 label="Loop this segment"
                />
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import MediaItem from '@/types/mediaitem'
import { ref } from 'vue'

// Props
const props = defineProps<{
    item: MediaItem
}>()

// // Local references
// const videoRef = ref<HTMLVideoElement | null>(null)
const loopSegment = ref<boolean>(false)

// watch(loopSegment, newVal => {
//     // If loopSegment is toggled on, set the event listener for timeupdate
//     // to auto-loop the segment. Otherwise, remove it.
//     if (newVal) {
//         videoRef.value?.addEventListener('timeupdate', handleTimeUpdate)
//     } else {
//         videoRef.value?.removeEventListener('timeupdate', handleTimeUpdate)
//     }
// })

// function handleTimeUpdate() {
//     const vid = videoRef.value
//     const seg = props.item.segmentInfo!
//     if (!vid || !seg) return
//     if (vid.currentTime >= seg.end) {
//         // Jump back to segment start
//         vid.currentTime = seg.start
//     }
// }

// onMounted(() => {
//     if (loopSegment.value) {
//         videoRef.value?.addEventListener('timeupdate', handleTimeUpdate)
//     }
// })
</script>

<style scoped>
/* Add any styling you need */
</style>
