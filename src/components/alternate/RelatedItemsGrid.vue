<template>
    <v-card flat>
        <!-- Controls for how many items to display per row or thumbnail size -->
        <div class="d-flex align-center mb-2">
            <span class="mr-2">Thumbnail Size:</span>
            <v-slider
             v-model="thumbnailSize"
             min="50"
             max="200"
             step="10"
             style="flex: 1"
            />
            <span class="ml-2">{{ thumbnailSize }}px</span>
        </div>
        
        <!-- The grid -->
        <div ref="gridRef" class="related-items-grid">
            <div
             v-for="(item, index) in subItems"
             :key="itemKey(item, index)"
             class="related-item"
             :class="{'selected': isSelected(item, index)}"
             :style="{ width: thumbnailSize + 'px', height: thumbnailSize + 'px' }"
             @click="onItemClick(item, index)"
            >
            <!-- Video segment -->
            <template v-if="type === 'video' && isSegment(item)">
                <!-- You could show a thumbnail or a short looping preview on hover -->
                <img :src="item.previewUrl" :alt="`Segment ${index + 1}`" />
            </template>
            
            <!-- Album image -->
            <template v-else-if="type === 'image' && isString(item)">
                <img :src="item" :alt="`Album image ${index + 1}`" />
            </template>
        </div>
    </div>
</v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { MediaItem, VideoSegment } from '@/stores/alternate/media'

// Props
const props = defineProps<{
    type: 'video' | 'image' | 'audio'
    mediaItem: MediaItem
    selectedSegmentId?: string
    selectedImageIndex?: number
}>()

// Emitting event to parent when an item is clicked
const emit = defineEmits<{
    (e: 'selectSegment', segmentId: string): void
    (e: 'selectImage', index: number): void
}>()

// Reactive thumbnail size
const thumbnailSize = ref(100) // in px

// A reference for the grid container
const gridRef = ref<HTMLElement | null>(null)

// Determine the sub-items based on media type
const subItems = computed(() => {
    if (props.type === 'video' && props.mediaItem.segments) {
        return props.mediaItem.segments
    } else if (props.type === 'image' && props.mediaItem.albumImages) {
        return props.mediaItem.albumImages
    }
    return []
})

// Utility to check if an item is a video segment
function isSegment(item: unknown): item is VideoSegment {
    return typeof item === 'object' && item !== null && 'segmentId' in item
}

// Utility to check if an item is a string (album image URL)
function isString(item: unknown): item is string {
    return typeof item === 'string'
}

// Generate a key
function itemKey(item: unknown, index: number) {
    if (isSegment(item)) return item.segmentId
    else if (isString(item)) return item
    return index
}

// Check if the item is currently “selected” (e.g., highlight)
function isSelected(item: unknown, index: number): boolean {
    if (isSegment(item) && props.selectedSegmentId) {
        return item.segmentId === props.selectedSegmentId
    }
    if (isString(item) && props.selectedImageIndex != null) {
        return index === props.selectedImageIndex
    }
    return false
}

// Handle click
function onItemClick(item: unknown, index: number) {
    if (isSegment(item)) {
        emit('selectSegment', item.segmentId)
    } else if (isString(item)) {
        emit('selectImage', index)
    }
}

// Scroll to the selected item if relevant
async function scrollToSelected() {
    if (!gridRef.value) return
    // Wait for DOM rendering
    await nextTick()
    
    const selectedEl = gridRef.value.querySelector('.related-item.selected')
    if (selectedEl instanceof HTMLElement) {
        // For example, scroll so this item is in view
        selectedEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
        })
    }
}

// Watch selectedSegmentId / selectedImageIndex changes to scroll
watch(
() => [props.selectedSegmentId, props.selectedImageIndex],
() => {
    scrollToSelected()
},
{ immediate: true }
)

onMounted(() => {
    scrollToSelected()
})
</script>

<style scoped>
.related-items-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 300px; /* or however tall you want the grid container to be */
    overflow-y: auto;
}

.related-item {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ccc;
    cursor: pointer;
}

.related-item.selected {
    border-color: #1976d2;
    box-shadow: 0 0 4px #1976d2;
}
</style>
