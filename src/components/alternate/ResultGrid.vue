<template>
    <v-card>
        <v-card-title>Search Results</v-card-title>
        <h4 class="text-center" v-if="shownIds.length === 0">Results will appear here</h4>
        <v-card-text>
            <v-container>
                <v-row>
                    <v-col
                     v-for="it,itIdx in shownIds"
                     :key="activeModelId+it.toString()+itIdx.toString()+Math.floor(Math.random() * 9000)"
                     cols="auto"
                     class="d-flex flex-column align-center mb-2"
                    >
                        <item 
                         :item-id="it"
                         :item-index="itIdx"
                         :model-id="activeModelId"
                         :btn-pos="true"
                         :btn-neg="true"
                         :btn-ignore="false"
                         :btn-submit="true"
                         :provided="false"
                         :overlay="true"
                         @replace-overlay="updateItem"
                        />
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
import { useChatStore } from '@/stores/chat';

// Props: pass in an array of media IDs
interface Props {
    resultIds: number[]
}
const props = defineProps<Props>()

const modelStore = useModelStore()
const chatStore = useChatStore()

const activeModelId = reactive(computed(() => modelStore.activeModel!.id))

// For controlling the amount shown initially
const itemsPerPage = ref(modelStore.activeModel!.settings.itemsToShow)

const emit = defineEmits<{
    (e: 'load-more'): void,
    (e: 'selected', itemId: number): void
}>()

const shownIds = computed(() => {
    return props.resultIds.slice(0, itemsPerPage.value)
})

async function onLoadMore() {
    emit('load-more')
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
