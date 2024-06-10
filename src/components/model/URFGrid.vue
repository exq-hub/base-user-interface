<template>
    <div class="w-50">
        <v-container
         height="70vh"
         align="center"
        >
            <v-row 
             justify="center"
             v-for="(grp, grdIdx) in grids.grids">
                <v-col 
                 v-for="(it, itIdx) in grp.items"
                 :key="activeModel.id+grdIdx+it"
                 cols="auto"
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
        <v-container class="ma-0 pa-0 pl-4 pr-4">
            <v-sheet 
             class="urf-btns mt-5 d-flex"
             rounded
            >
                <v-btn class="mr-10" stacked :elevation="0"
                 @click="updateItems"
                >
                    <v-icon>mdi-refresh</v-icon>
                    Update
                </v-btn>
                <v-btn stacked :elevation="0"
                 @click="clearModel"
                >
                    <v-icon>mdi-close</v-icon>
                    Clear
                </v-btn>
            </v-sheet>
            <v-sheet class="urf-ctrl d-flex mt-1">
                <v-checkbox v-model="checkFilters" class="mr-10" hide-details label="Apply Filters" />
                <v-checkbox v-model="checkAddNegs" hide-details label="Add Negatives" />
            </v-sheet>
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
const filterStore = useFilterStore()

const checkFilters = ref(true)
const checkAddNegs = ref(false)

watch(activeModel, () => {
    console.log(activeModel.value.grid[0])
    grids.grids = activeModel.value.grid
})

function getRandomItems() {
    let rngItems = new Set<number>()
    while (rngItems.size != 10) {
        rngItems.add(Math.floor(Math.random()*modelStore.totalItems)+1)
    }
    return rngItems
}

async function updateItems() {
    console.log('Updating Items')
    let gridItems = grids.grids[0].items 
    console.log('gridItems', gridItems)
    itemStore.addItemsToSet(gridItems, activeModel.value.id, ILSets.History)
    let n = activeModel.value.settings.groups[0].itemsToShow;
    let pos = itemStore.getSetItems(activeModel.value.id, ILSets.Positives).map((e,_) => e.id)
    let neg = itemStore.getSetItems(activeModel.value.id, ILSets.Negatives).map((e,_) => e.id)
    let hist = itemStore.getSetItems(activeModel.value.id, ILSets.History).map((e,_) => e.id)
    hist.push(...pos)
    hist.push(...neg)
    hist.push(...gridItems) //TODO: No hardcoded value here!!
    if (checkAddNegs) {
        neg.push(...getRandomItems())
    }
    let exclude : number[] = []
    if (itemStore.modelExcluded.has(activeModel.value.id)) {
        exclude = Array.from(itemStore.modelExcluded.get(activeModel.value.id)!)
    }
    let reqObj : ExqURFRequest = {
        session_info: {
            session: useAppStore().session, 
            modelId: activeModel.value.id,
        },
        n: n,
        pos: pos,
        neg: neg,
        seen: hist,
        excluded: exclude
    }

    if (checkFilters.value) {
        let filters = useFilterStore().getModelFilters(activeModel.value.id)
        reqObj.filters = filters
    }

    await modelStore.getSuggestions(reqObj, grids.grids[0].id)
    grids.grids = activeModel.value.grid
}

async function replaceItem(itemIdx: number, set: ILSets) {
    console.log('Replacing Item', itemIdx, set)
    let pos = itemStore.getSetItems(activeModel.value.id, ILSets.Positives).map((e,_) => e.id)
    let neg = itemStore.getSetItems(activeModel.value.id, ILSets.Negatives).map((e,_) => e.id)
    let hist = itemStore.getSetItems(activeModel.value.id, ILSets.History).map((e,_) => e.id)
    hist.push(...pos)
    hist.push(...neg)
    hist.push(...grids.grids[0].items) //TODO: No hardcoded value here!!
    if (checkAddNegs) {
        neg.push(...getRandomItems())
    }
    let exclude : number[] = []
    if (itemStore.modelExcluded.has(activeModel.value.id)) {
        exclude = Array.from(itemStore.modelExcluded.get(activeModel.value.id)!)
    }
    let reqObj : ExqURFRequest = {
        session_info: {
            session: useAppStore().session, 
            modelId: activeModel.value.id,
        },
        n: 1,
        pos: pos,
        neg: neg,
        seen: hist,
        excluded: exclude
    }
    if (checkFilters.value) {
        let filters = useFilterStore().getModelFilters(activeModel.value.id)
        console.log(filters)
        reqObj.filters = filters
    }
    await modelStore.getSuggestions(reqObj, 0, itemIdx) //TODO: Fix hardcoded value!!
    grids.grids = activeModel.value.grid
}

async function clearModel() {
    itemStore.removeModelFromItems(activeModel.value.id)
    itemStore.modelItems.get(activeModel.value.id)?.clear()
    modelStore.resetModel(activeModel.value)
    filterStore.clearFilters(activeModel.value.id)
    grids.grids = activeModel.value.grid
}
</script>

<style scoped>
.v-col {
    flex: auto;
    padding-top: 5px;
    padding-bottom: 0;
    padding-right: 1px;
    padding-left: 1px;
}

.urf-btns {
    justify-content: center;
}

.urf-ctrl {
    justify-content: center;
}
</style>