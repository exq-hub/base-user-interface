<template>
    <v-card 
     data-eid="related_items_grid_card"
     flat
    >
        <!-- Controls for how many items to display per row or thumbnail size -->
        <!-- <div class="d-flex align-center mb-2">
            <span class="mr-2">Thumbnail Size:</span>
            <v-slider
             v-model="thumbnailSize"
             min="50"
             max="200"
             step="10"
             style="flex: 1"
            />
            <span class="ml-2">{{ thumbnailSize }}px</span>
        </div> -->
        
        <!-- The grid -->
        <div 
         ref="gridRef" 
         class="related-items-grid"
        >
            <div
             v-for="(it, index) in relatedItems"
             :data-eid="'related_item_'+it"
             :key="it.toString()+index.toString()+mediaItem.groupId"
             class="related-item mb-5"
             :class="{'selected': isSelected(it)}"
             :style="{ width: thumbnailSize_w + 'px', height: thumbnailSize_h + 'px' }"
             @click="onItemClick(it)"
            >
                <item
                 :item-id="it"
                 :item-index="index"
                 :model-id="modelId"
                 :btn-pos="true"
                 :btn-neg="true"
                 :btn-ignore="false"
                 :btn-submit="true"
                 :provided="false"
                 :overlay="true"
                />
            </div>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, } from 'vue'
//nextTick } from 'vue'
import MediaItem from '@/types/mediaitem'
import { useItemStore } from '@/stores/item';
import { logEvents } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';

// Props
const props = defineProps<{
    modelId: number
    mediaItem: MediaItem
    relatedItems: number[]
}>()

const itemStore = useItemStore()
const mainItem = ref(props.mediaItem)
const selected = reactive(computed(() => itemStore.getSelectedItem()))

// Emitting event to parent when an item is clicked
const emit = defineEmits<{
    (e: 'selectItem', itemId: number): void
}>()

// Reactive thumbnail size
const thumbnailSize_w = ref(155) // in px
const thumbnailSize_h = ref(thumbnailSize_w.value+30) // in px

// A reference for the grid container
// const gridRef = ref<HTMLElement | null>(null)

// Check if the item is currently “selected” (e.g., highlight)
function isSelected(itemId: number): boolean {
    return itemId === selected.value.id
}

// Handle click
async function onItemClick(itemId: number) {
    logEvents([{
        ts: Date.now(),
        action: 'Related Item Clicked ' + itemId,
        session: useAppStore().session, 
        data: itemId
    }])
    mainItem.value = await itemStore.fetchMediaItem(itemId, props.modelId)
    await useItemStore().setSelectedItem(itemId)
    emit('selectItem', itemId)
}

// Scroll to the selected item if relevant
// async function scrollToSelected() {
//     if (!gridRef.value) return
//     // Wait for DOM rendering
//     await nextTick()
    
//     const selectedEl = gridRef.value.querySelector('.related-item.selected')
//     if (selectedEl instanceof HTMLElement) {
//         // For example, scroll so this item is in view
//         selectedEl.scrollIntoView({
//             behavior: 'smooth',
//             block: 'nearest',
//             inline: 'center',
//         })
//     }
// }


// Watch selectedSegmentId / selectedImageIndex changes to scroll
watch(
    () => selected.value.id,
    () => {
        // scrollToSelected()
    },
    { immediate: true }
)

onMounted(() => {
    // scrollToSelected()
})
</script>

<style scoped>
.related-items-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    max-height: 50vh; /* or however tall you want the grid container to be */
    overflow-y: auto;
    justify-content: center;
}

.related-item {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.related-item.selected {
    border: 3px solid rgb(var(--v-theme-primary));
    box-shadow: 0 0 6px rgba(var(--v-theme-primary), 0.4);
}
</style>
