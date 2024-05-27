<template>
    <!-- Button Sheet -->
    <v-sheet
     class="text-center pt-3 pb-3"
     color="orange-lighten-2"
    >
        <v-btn size="small" icon="mdi-close" @click="clearExcluded"></v-btn>
    </v-sheet>
    <!-- Result List -->
    <v-list v-model="loaded" :key="activeModelId">
        <v-list-item v-for="it in excludedItems.items">
            <item 
             :item-id="it"
             :model-id="activeModelId"
             :btn-pos="true"
             :btn-neg="true"
             :btn-ignore="false"
             :btn-submit="true"
             :provided="false"
             :overlay="true"
            />
        </v-list-item>
    </v-list>
</template>


<script setup lang="ts">
import { reactive, ref } from 'vue';
import Item from '@/components/items/Item.vue';
import { clearExcludedVideos, getExcludedVideos, } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useModelStore } from '@/stores/model';

const activeModelId = computed(() => useModelStore().activeModel.id)

const excludedItems: { items: number[] } = reactive({ items: [] })

const loaded = ref(false)

const session = useAppStore().session

async function getExcludedVids() {
    excludedItems.items = await getExcludedVideos({session: session, model: activeModelId.value}).then(val => val.videos)
    console.log(excludedItems.items)
    loaded.value = true
}

async function clearExcluded() {
    await clearExcludedVideos({session: session, model: activeModelId.value, items: excludedItems.items})
            .then(() => excludedItems.items = [])
}

getExcludedVids()
</script>


<style scoped>
.tooltip-opacity :deep(.v-overlay__content) {
  background: rgba(255, 255, 255, 0.856) !important;
}
</style>