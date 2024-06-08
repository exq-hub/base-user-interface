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
        <v-list-item v-for="(it,idx) in excludedItems.items">
            <item 
             :item-id="it"
             :grid-index="0"
             :item-index="idx"
             :model-id="activeModelId"
             :btn-pos="true"
             :btn-neg="true"
             :btn-ignore="false"
             :btn-submit="true"
             :provided="false"
             :overlay="false"
            />
        </v-list-item>
    </v-list>
</template>


<script setup lang="ts">
import { reactive, ref } from 'vue';
import Item from '@/components/items/Item.vue';
import { clearExcludedGroups } from '@/services/ExquisitorAPI';
import { useAppStore } from '@/stores/app';
import { useModelStore } from '@/stores/model';
import { useItemStore } from '@/stores/item';

const activeModelId = computed(() => useModelStore().activeModel.id)

const excludedItems: { items: number[] } = reactive({ items: [] })

const loaded = ref(false)

const session = useAppStore().session

const itemStore = useItemStore()

async function getExcludedGroups() {
    if (itemStore.modelExcluded.has(activeModelId.value)) {
        excludedItems.items = Array.from(itemStore.modelExcluded.get(activeModelId.value)!)
    } else {
        excludedItems.items = []
    }
    console.log(excludedItems.items)
    loaded.value = true
}

async function clearExcluded() {
    excludedItems.items.forEach( v => 
        itemStore.removeItemFromExclude(v, activeModelId.value)
    )
    // Logging
    clearExcludedGroups({
        session_info: {
            session: session,
            modelId: activeModelId.value
        }, 
        items: excludedItems.items
    })

    excludedItems.items = []
}

getExcludedGroups()
</script>


<style scoped>
.tooltip-opacity :deep(.v-overlay__content) {
  background: rgba(255, 255, 255, 0.856) !important;
}
</style>