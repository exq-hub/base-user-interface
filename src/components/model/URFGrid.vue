<template>
    <div class="w-50">
        <v-row dense v-for="(grp, idx) in grids.grids">
            <v-col v-for="it in grp.items"
             :key="activeModel.id+idx"
             cols="3"
            >
                <item 
                 :item-id="it"
                 :model-id="activeModel.id"
                 :btn-pos="true"
                 :btn-neg="true"
                 :btn-ignore="true"
                 :btn-submit="true"
                 :provided="false"
                 :overlay="false"
                />
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts" setup>
import { useModelStore } from '@/stores/model';
import Item from '@/components/items/Item.vue'

const activeModel = computed(() => useModelStore().activeModel)
const grids = reactive({grids:activeModel.value.grid})

watch(activeModel, () => {
    console.log(activeModel.value.grid[0])
    grids.grids = activeModel.value.grid
})

</script>

<style scoped>

</style>