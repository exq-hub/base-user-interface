<template>
    <v-card>
        <v-card-title>Search Results</v-card-title>
        <h4 class="text-center" v-if="shownIds.length === 0">Results will appear here</h4>
        <v-card-text>
            <v-container>
                <v-row>
                    <v-col
                     v-for="it,itIdx in shownIds"
                     :key="it+itIdx"
                     cols="auto"
                     class="d-flex flex-column align-center mb-2"
                    >
                        <item 
                         :item-id="it"
                         :item-index="itIdx"
                         :model-id="modelStore.activeModel!.id"
                         :btn-pos="true"
                         :btn-neg="true"
                         :btn-ignore="false"
                         :btn-submit="true"
                         :provided="false"
                         :overlay="true"
                         @replace-overlay="updateItem"
                        />
                        <!-- <div class="thumbnail-wrapper" @mouseover="onHover(id)" @mouseleave="onLeave(id)">
                            <img
                             v-if="items.get(id).mediaType !== MediaType.Video"
                             :src="items.get(id)!.thumbPath"
                             :alt="items.get(id)!.name"
                             style="max-width: 100%;"
                             @click="onClickItem(id)"
                            />
                            <video
                             v-else
                             :src="items.get(id)!.metadata!.segments?.[0].previewUrl"
                             :poster="items.get(id)!.thumbPath"
                             ref="videoRefs[id]"
                             style="max-width: 100%;"
                             @click="onClickItem(id)"
                            />
                        </div>
                        <div class="mt-1 text-caption">
                            {{ items.get(id)!.name }}
                        </div> -->
                    </v-col>
                </v-row>
            </v-container>
        </v-card-text>

        <v-card-actions>
            <v-btn color="primary" @click="onLoadMore">
                Load More
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useModelStore } from '@/stores/model';
import Item from '../items/Item.vue';

// Props: pass in an array of media IDs
interface Props {
    modelId: number
    resultIds: number[]
}
const props = defineProps<Props>()

const modelStore = useModelStore()

// For controlling the amount shown initially
const itemsPerPage = ref(modelStore.activeModel!.settings.itemsToShow)

const emit = defineEmits<{
    (e: 'load-more', resultIds: number[]): void,
    (e: 'selected', itemId: number): void
}>()

const shownIds = computed(() => {
    return props.resultIds.slice(0, itemsPerPage.value)
})

function onLoadMore() {
    itemsPerPage.value += 50 // Or some other logic
}

function updateItem(id: number) {
    emit('selected', id)
}
</script>

<style scoped>
.thumbnail-wrapper {
    width: 100%;
    position: relative;
    cursor: pointer;
    overflow: hidden;
}
</style>
