<template>
    <!-- Button Sheet -->
    <v-sheet
     class="text-center pt-3 pb-3"
     color="orange-lighten-2"
    >
        <v-btn :data-eid="'exc_groups_clear_btn_model_' + activeModelId" size="small" @click="clearExcluded">
            Clear List
        </v-btn>
    </v-sheet>
    <!-- Result List -->
    <v-list :key="activeModelId">
        <v-list-item v-for="(it,idx) in excludedItems()">
            <item 
             :item-id="it"
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
import Item from '@/components/items/Item.vue';
import { useModelStore } from '@/stores/model';
import { useItemStore } from '@/stores/item';

const activeModelId = computed(() => useModelStore().activeModel!.id)

const itemStore = useItemStore()

const excludedItems = computed(() => getExcludedGroups)

function getExcludedGroups() {
    if (itemStore.modelExcluded.has(activeModelId.value)) {
        return Array.from(itemStore.modelExcluded.get(activeModelId.value)!)
    } else {
        return []
    }
}

async function clearExcluded() {
    excludedItems.value().forEach( v => 
        itemStore.removeItemFromExclude(v)
    )
}

</script>


<style scoped>
.tooltip-opacity :deep(.v-overlay__content) {
  background: rgba(255, 255, 255, 0.856) !important;
}
</style>