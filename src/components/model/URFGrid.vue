<template>
    <div class="w-50">
        <v-container>
            <v-row dense v-for="(grp, grdIdx) in grids.grids">
                <v-col v-for="(it, itIdx) in grp.items"
                 :key="activeModel.id+grdIdx+it"
                 cols="3"
                >
                    <item 
                     :item-id="it"
                     :item-index="itIdx"
                     :grid-index="grdIdx"
                     :model-id="activeModel.id"
                     :btn-pos="true"
                     :btn-neg="true"
                     :btn-ignore="true"
                     :btn-submit="true"
                     :provided="false"
                     :overlay="false"
                     @replace="replaceItem"
                    />
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script lang="ts" setup>
import { useModelStore } from '@/stores/model';
import Item from '@/components/items/Item.vue'
import { ILSets } from '@/types/mediaitem';
import { useAppStore } from '@/stores/app';
import { useItemStore } from '@/stores/item';
import { ExqURFRequest } from '@/types/exq';
import { useFilterStore } from '@/stores/filter';

const modelStore = useModelStore()
const activeModel = computed(() => modelStore.activeModel)
const grids = reactive({grids:activeModel.value.grid})

const itemStore = useItemStore()

watch(activeModel, () => {
    console.log(activeModel.value.grid[0])
    grids.grids = activeModel.value.grid
})

async function replaceItem(itemIdx: number, gridIdx: number, set: ILSets) {
    console.log('Replacing Item', itemIdx, gridIdx, set)
    let pos = itemStore.getSetItems(activeModel.value.id, ILSets.Positives).map((e,_) => e.id)
    let neg = itemStore.getSetItems(activeModel.value.id, ILSets.Negatives).map((e,_) => e.id)
    let hist = itemStore.getSetItems(activeModel.value.id, ILSets.History).map((e,_) => e.id)
    hist.push(...pos)
    hist.push(...neg)
    let filters = useFilterStore().getModelFilters(activeModel.value.id)
    const reqObj : ExqURFRequest = {
        session: useAppStore().session, 
        modelId: activeModel.value.id,
        n: 1,
        pos: pos,
        neg: neg,
        seen: hist,
        filters: filters,
        excluded: [] //TODO
    }
    await modelStore.getSuggestions(reqObj, gridIdx, itemIdx)
    grids.grids = activeModel.value.grid
}

</script>

<style scoped>

</style>