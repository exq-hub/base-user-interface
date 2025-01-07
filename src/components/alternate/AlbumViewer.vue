<!-- src/components/AlbumViewer.vue -->
<template>
    <v-card flat>
        <v-card-text>
            <div>
                <img
                 :src="item.srcPath"
                 :alt="`Album Image ${item.name}`"
                 style="max-width: 100%; height: auto;"
                />
            </div>
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import MediaItem from '@/types/mediaitem';

// Props: the album item and an optional selected image index
defineProps<{
    item: MediaItem
}>()

</script>

<style scoped>
/* Basic styling */
</style>
