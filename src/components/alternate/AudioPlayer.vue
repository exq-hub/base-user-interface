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
import MediaItem from '@/types/mediaitem';
import { computed } from 'vue'



// Props
const props = defineProps<{
    item: MediaItem
}>()

// Compute if item has an audioUrl
const audioUrl = computed(() => {
    return props.item.srcPath || ''
})
</script>

<style scoped>
/* Basic styling */
</style>