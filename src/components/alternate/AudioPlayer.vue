<template>
    <v-card flat>
        <v-card-text>
            <audio
             v-if="audioUrl"
             :src="audioUrl"
             controls
             style="width: 100%;"
            >
                Your browser does not support the audio tag.
            </audio>
            <div v-else>
                <p>No audio URL found.</p>
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
    audioUrl?: string
}

// Props
const props = defineProps<{
    item: MediaItem
}>()

// Compute if item has an audioUrl
const audioUrl = computed(() => {
    return props.item.audioUrl || ''
})
</script>

<style scoped>
/* Basic styling */
</style>